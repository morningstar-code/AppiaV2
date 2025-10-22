import { Router } from 'express';
import { prisma } from '../services/database';
import { ErrorResponse } from '../types';

const router = Router();

// Get all projects for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to fetch projects' };
    res.status(500).json(errorResponse);
  }
});

// Create a new project
router.post('/', async (req, res) => {
  try {
    const { userId, name, description, language, prompt, code, files, isPublic } = req.body;
    
    const project = await prisma.project.create({
      data: {
        userId,
        name,
        description,
        language,
        prompt,
        code,
        files,
        isPublic
      }
    });
    
    res.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to create project' };
    res.status(500).json(errorResponse);
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, language, prompt, code, files, isPublic } = req.body;
    
    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        language,
        prompt,
        code,
        files,
        isPublic
      }
    });
    
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to update project' };
    res.status(500).json(errorResponse);
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.project.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    const errorResponse: ErrorResponse = { error: 'Failed to delete project' };
    res.status(500).json(errorResponse);
  }
});

export default router;
