import prisma from '../../shared/prisma';
import { NotFoundError, ForbiddenError } from '../../shared/errors';
import { slugify, parsePagination } from '../../shared/helpers';
import { CreateEventInput, UpdateEventInput, EventQuery } from './events.schema';
import { Prisma, Role } from '@prisma/client';

export class EventsService {
  private readonly eventSelect = {
    id: true,
    title: true,
    slug: true,
    description: true,
    date: true,
    startTime: true,
    endTime: true,
    location: true,
    isOnline: true,
    meetingUrl: true,
    bannerImage: true,
    capacity: true,
    registeredCount: true,
    status: true,
    tags: true,
    registrationDeadline: true,
    isFeatured: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
    organizer: {
      select: { id: true, firstName: true, lastName: true, avatar: true },
    },
    category: {
      select: { id: true, name: true, slug: true, icon: true, color: true },
    },
    club: {
      select: { id: true, name: true, slug: true, logo: true },
    },
    _count: {
      select: { registrations: true, feedback: true, bookmarks: true },
    },
    ticketTiers: true,
  };

  async findAll(query: EventQuery) {
    const { page, limit, skip } = parsePagination(query);
    
    const where: Prisma.EventWhereInput = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = { not: 'DRAFT' };
    }

    if (query.dateFrom) {
      where.date = { ...((where.date as any) || {}), gte: new Date(query.dateFrom) };
    }
    if (query.dateTo) {
      where.date = { ...((where.date as any) || {}), lte: new Date(query.dateTo) };
    }

    const orderBy: Prisma.EventOrderByWithRelationInput = {};
    switch (query.sortBy) {
      case 'popularity':
        orderBy.registeredCount = query.sortOrder;
        break;
      case 'title':
        orderBy.title = query.sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = query.sortOrder;
        break;
      default:
        orderBy.date = query.sortOrder;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select: this.eventSelect,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total, page, limit };
  }

  async findById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        ...this.eventSelect,
        speakers: true,
        schedules: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!event) throw new NotFoundError('Event');

    // Increment view count
    await prisma.event.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return event;
  }

  async findBySlug(slug: string) {
    const event = await prisma.event.findUnique({
      where: { slug },
      select: {
        ...this.eventSelect,
        speakers: true,
        schedules: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!event) throw new NotFoundError('Event');
    return event;
  }

  async create(data: CreateEventInput, organizerId: string, universityId?: string | null) {
    const slug = slugify(data.title);

    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        isOnline: data.isOnline,
        meetingUrl: data.meetingUrl,
        capacity: data.capacity,
        categoryId: data.categoryId,
        clubId: data.clubId,
        tags: data.tags || [],
        registrationDeadline: data.registrationDeadline
          ? new Date(data.registrationDeadline)
          : null,
        isFeatured: data.isFeatured,
        isFree: data.ticketTiers.every(t => t.price === 0),
        price: data.ticketTiers.length > 0 ? data.ticketTiers[0].price : 0,
        organizerId,
        universityId: universityId || undefined,
        status: 'PUBLISHED',
        ticketTiers: {
          create: data.ticketTiers.map(t => ({
            name: t.name,
            price: t.price,
            capacity: t.capacity,
            description: t.description
          }))
        }
      },
      select: this.eventSelect,
    });

    return event;
  }

  async update(id: string, data: UpdateEventInput, userId: string, userRole: Role) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Event');

    // Only organizer or admin can update
    if (event.organizerId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new ForbiddenError('You can only edit your own events');
    }

    const { ticketTiers, clubId, ...updateData } = data;
    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...updateData,
        ...(clubId !== undefined && { clubId: clubId || null }),
        date: data.date ? new Date(data.date) : undefined,
        registrationDeadline: data.registrationDeadline
          ? new Date(data.registrationDeadline)
          : undefined,
      },
      select: this.eventSelect,
    });

    return updated;
  }

  async delete(id: string, userId: string, userRole: Role) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundError('Event');

    if (event.organizerId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      throw new ForbiddenError('You can only delete your own events');
    }

    await prisma.event.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Event cancelled successfully' };
  }

  async getTrending(limit: number = 6) {
    return prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        date: { gte: new Date() },
      },
      select: this.eventSelect,
      orderBy: [
        { registeredCount: 'desc' },
        { viewCount: 'desc' },
      ],
      take: limit,
    });
  }

  async getUpcoming(limit: number = 6) {
    return prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        date: { gte: new Date() },
      },
      select: this.eventSelect,
      orderBy: { date: 'asc' },
      take: limit,
    });
  }

  async getFeatured(limit: number = 4) {
    return prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        isFeatured: true,
        date: { gte: new Date() },
      },
      select: this.eventSelect,
      orderBy: { date: 'asc' },
      take: limit,
    });
  }

  async getByOrganizer(organizerId: string, query: EventQuery) {
    const { page, limit, skip } = parsePagination(query);
    
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { organizerId },
        select: this.eventSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where: { organizerId } }),
    ]);

    return { events, total, page, limit };
  }
}

export const eventsService = new EventsService();
