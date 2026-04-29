import { Request, Response } from 'express';
import Announcement from '../models/Announcement';
import { sendSuccess, sendError } from '../utils/response';

export const getAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', audience } = req.query as Record<string, string>;
    const role = req.user?.role;

    const filter: Record<string, unknown> = { tenantId: req.tenantId };

    if (role === 'student') {
      filter['isActive'] = true;
      filter['targetAudience'] = { $in: ['all', 'students'] };
    } else if (role === 'teacher') {
      filter['isActive'] = true;
      filter['targetAudience'] = { $in: ['all', 'teachers'] };
    } else if (audience) {
      filter['targetAudience'] = audience;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Announcement.countDocuments(filter),
    ]);

    sendSuccess(res, { announcements, total, page: pageNum, limit: limitNum }, 'Announcements fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch announcements', 500, err);
  }
};

export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, targetAudience } = req.body as {
      title: string; content: string; targetAudience?: string;
    };

    if (!title?.trim() || !content?.trim()) {
      sendError(res, 'Title and content are required', 400);
      return;
    }

    const announcement = await Announcement.create({
      tenantId: req.tenantId,
      title: title.trim(),
      content: content.trim(),
      targetAudience: targetAudience || 'all',
      createdBy: req.user?._id,
    });

    sendSuccess(res, announcement, 'Announcement created', 201);
  } catch (err) {
    sendError(res, 'Failed to create announcement', 500, err);
  }
};

export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, targetAudience, isActive } = req.body as {
      title?: string; content?: string; targetAudience?: string; isActive?: boolean;
    };

    const update: Record<string, unknown> = {};
    if (title !== undefined) update['title'] = title.trim();
    if (content !== undefined) update['content'] = content.trim();
    if (targetAudience !== undefined) update['targetAudience'] = targetAudience;
    if (isActive !== undefined) update['isActive'] = isActive;

    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params['id'], tenantId: req.tenantId },
      update,
      { new: true, runValidators: true }
    );

    if (!announcement) { sendError(res, 'Announcement not found', 404); return; }
    sendSuccess(res, announcement, 'Announcement updated');
  } catch (err) {
    sendError(res, 'Failed to update announcement', 500, err);
  }
};

export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await Announcement.findOneAndDelete({
      _id: req.params['id'],
      tenantId: req.tenantId,
    });
    if (!deleted) { sendError(res, 'Announcement not found', 404); return; }
    sendSuccess(res, null, 'Announcement deleted');
  } catch (err) {
    sendError(res, 'Failed to delete announcement', 500, err);
  }
};
