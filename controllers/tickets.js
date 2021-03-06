const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const ErrorResponse = require('../utils/errorResponse');
const advancedResults = require('../utils/advancedResults')

// @desc   Get all tickets
// @route  GET /api/v1/tickets
// @route  GET /api/v1/projects/:id/tickets
// @acces  Public
exports.getTickets = async (req, res, next) => {
  try {
    const reqQuery = { ...req.query };

    // Fields to remove
    const removeFields = ['select', 'sort', 'limit', 'page', 'user'];
    removeFields.forEach(field => {
      delete reqQuery[field];
    })

    // Find resource
    if (req.params.id) {
      query = Ticket.find({ project: req.params.id })
    } else if (req.query.user) {
      query = Ticket.find({
        $or: [
          { submitter: req.query.user },
          { developer: req.query.user }
        ]
      })
    } else {
      query = Ticket.find(reqQuery)
    }

    // Populate
    query = query
      .populate('developer')
      .populate('submitter')
      .populate({
        path: 'project',
        select: 'name description'
      });

    // Select, sort, pagination
    const advancedQuery = advancedResults(query, req.query);

    query = advancedQuery.query;

    const tickets = await query;

    const total = await Ticket.countDocuments()
    const totalPages = Math.ceil(total / advancedQuery.limit)

    res.status(201).json({
      success: true,
      page: advancedQuery.page,
      limit: advancedQuery.limit,
      count: tickets.length,
      total,
      totalPages,
      data: tickets
    })
  } catch (error) {
    next(error)
  }
}

// @desc   Get single ticket
// @route  GET /api/v1/ticket/:id
// @acces  Public
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('developer')
      .populate('submitter')
      .populate({
        path: 'project',
        select: 'name description'
      })

    if (!ticket) {
      return next(new ErrorResponse(`Ticket with id ${req.params.id} not found`, 404))
    }

    res.status(200).json({ success: true, data: ticket })
  } catch (error) {
    next(error)
  }
}

// @desc   Add ticket
// @route  POST /api/v1/projects/:id/tickets
// @acces  Private
exports.addTicket = async (req, res, next) => {
  try {
    req.body.project = req.params.id;
    req.body.submitter = req.user.id;

    const project = await Project.findById(req.body.project);
    if (!project) {
      return next(new ErrorResponse(`No project with the id ${req.params.id}`, 404))
    }

    const ticket = await Ticket.create(req.body);

    res.status(201).json({ success: true, data: ticket })
  } catch (error) {
    next(error)
  }
}

// @desc   Update ticket
// @route  PUT /api/v1/ticket/:id
// @acces  Private
exports.updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)

    if (!ticket) {
      return next(new ErrorResponse(`Ticket with id ${req.params.id} not found`, 404))
    }

    // Authorize user
    if (ticket.developer) {
      if (req.user.id === ticket.developer.toString() || req.user.role === 'admin' || req.user.role === 'project manager') {
        await Ticket.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true
        });
      } else {
        return next(new ErrorResponse('Unauthorized to delete this ticket', 401))
      }
    } else {
      if (req.user.role === 'admin' || req.user.role === 'project manager') {
        await Ticket.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
          runValidators: true
        });
      } else {
        return next(new ErrorResponse('Unauthorized to delete this ticket', 401))
      }
    }

    res.status(200).json({ success: true, data: ticket })
  } catch (error) {
    next(error)
  }
}

// @desc   Delete ticket
// @route  DELETE /api/v1/ticket/:id
// @acces  Private
exports.deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)

    if (!ticket) {
      return next(new ErrorResponse(`Ticket with id ${req.params.id} not found`, 404))
    }

    if (req.user.id === ticket.submitter.toString() || req.user.role === 'admin' || req.user.role === 'project manager') {
      await ticket.remove();
    } else {
      return next(new ErrorResponse('Unauthorized to delete this ticket', 401))
    }

    res.status(200).json({ success: true, data: {} })
  } catch (error) {
    next(error)
  }
}
