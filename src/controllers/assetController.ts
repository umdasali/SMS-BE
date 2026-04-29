import { Request, Response } from 'express';
import Asset from '../models/Asset';
import AssetAssignment from '../models/AssetAssignment';
import Student from '../models/Student';
import { sendSuccess, sendError } from '../utils/response';

// ── Asset CRUD ────────────────────────────────────────────────────────────────

export const getAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const assets = await Asset.find({ tenantId: req.tenantId }).sort({ name: 1 });
    sendSuccess(res, assets, 'Assets fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch assets', 500, err);
  }
};

export const createAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body as { name: string; description?: string };
    if (!name?.trim()) { sendError(res, 'Asset name is required', 400); return; }

    const existing = await Asset.findOne({ tenantId: req.tenantId, name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) { sendError(res, 'An asset with this name already exists', 400); return; }

    const asset = await Asset.create({ tenantId: req.tenantId, name: name.trim(), description: description?.trim() || '' });
    sendSuccess(res, asset, 'Asset created', 201);
  } catch (err) {
    sendError(res, 'Failed to create asset', 500, err);
  }
};

export const updateAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body as { name?: string; description?: string };
    if (name?.trim()) {
      const existing = await Asset.findOne({
        tenantId: req.tenantId,
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        _id: { $ne: req.params['id'] },
      });
      if (existing) { sendError(res, 'An asset with this name already exists', 400); return; }
    }

    const asset = await Asset.findOneAndUpdate(
      { _id: req.params['id'], tenantId: req.tenantId },
      { ...(name?.trim() && { name: name.trim() }), ...(description !== undefined && { description: description.trim() }) },
      { new: true }
    );
    if (!asset) { sendError(res, 'Asset not found', 404); return; }
    sendSuccess(res, asset, 'Asset updated');
  } catch (err) {
    sendError(res, 'Failed to update asset', 500, err);
  }
};

export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const hasAssignments = await AssetAssignment.exists({ assetId: req.params['id'], tenantId: req.tenantId });
    if (hasAssignments) {
      sendError(res, 'Cannot delete asset — it has issuance records. Delete those records first.', 400);
      return;
    }

    const asset = await Asset.findOneAndDelete({ _id: req.params['id'], tenantId: req.tenantId });
    if (!asset) { sendError(res, 'Asset not found', 404); return; }
    sendSuccess(res, null, 'Asset deleted');
  } catch (err) {
    sendError(res, 'Failed to delete asset', 500, err);
  }
};

// ── Asset Assignments ─────────────────────────────────────────────────────────

export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetId, studentId, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId: req.tenantId };
    if (assetId) filter['assetId'] = assetId;
    if (studentId) filter['studentId'] = studentId;

    if (search) {
      const matchingStudents = await Student.find({
        tenantId: req.tenantId,
        name: { $regex: search, $options: 'i' },
      }).select('_id');
      filter['studentId'] = { $in: matchingStudents.map((s) => s._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [assignments, total] = await Promise.all([
      AssetAssignment.find(filter)
        .populate('assetId', 'name description')
        .populate({ path: 'studentId', select: 'name admissionNo classId', populate: { path: 'classId', select: 'name' } })
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      AssetAssignment.countDocuments(filter),
    ]);

    sendSuccess(res, { assignments, total, page: parseInt(page), limit: parseInt(limit) }, 'Assignments fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch assignments', 500, err);
  }
};

export const createAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetId, studentId, assignedDate, notes } = req.body as {
      assetId: string; studentId: string; assignedDate?: string; notes?: string;
    };

    if (!assetId) { sendError(res, 'Asset is required', 400); return; }
    if (!studentId) { sendError(res, 'Student is required', 400); return; }

    const [asset, student] = await Promise.all([
      Asset.findOne({ _id: assetId, tenantId: req.tenantId }),
      Student.findOne({ _id: studentId, tenantId: req.tenantId }),
    ]);
    if (!asset) { sendError(res, 'Asset not found', 404); return; }
    if (!student) { sendError(res, 'Student not found', 404); return; }

    const assignment = await AssetAssignment.create({
      tenantId: req.tenantId,
      assetId,
      studentId,
      assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
      notes: notes?.trim() || '',
    });

    const populated = await assignment.populate([
      { path: 'assetId', select: 'name description' },
      { path: 'studentId', select: 'name admissionNo classId', populate: { path: 'classId', select: 'name' } },
    ]);

    sendSuccess(res, populated, 'Asset issued to student', 201);
  } catch (err) {
    sendError(res, 'Failed to issue asset', 500, err);
  }
};

export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await AssetAssignment.findOneAndDelete({ _id: req.params['id'], tenantId: req.tenantId });
    if (!assignment) { sendError(res, 'Assignment not found', 404); return; }
    sendSuccess(res, null, 'Assignment deleted');
  } catch (err) {
    sendError(res, 'Failed to delete assignment', 500, err);
  }
};

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getAssetStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalAssetTypes, totalIssuances, studentsIssuedAssets] = await Promise.all([
      Asset.countDocuments({ tenantId: req.tenantId }),
      AssetAssignment.countDocuments({ tenantId: req.tenantId }),
      AssetAssignment.distinct('studentId', { tenantId: req.tenantId }),
    ]);

    sendSuccess(res, {
      totalAssetTypes,
      totalIssuances,
      studentsIssuedAssets: studentsIssuedAssets.length,
    }, 'Stats fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch stats', 500, err);
  }
};
