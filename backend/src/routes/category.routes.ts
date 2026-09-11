import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { requireOwner } from '../middlewares/stockAccess';
import { validateBody } from '../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router({ mergeParams: true });

// Leitura: Permitida a todos os membros do estoque
router.get('/', (req, res) => categoryController.listCategories(req, res));

// Modificação: Apenas DONO do estoque
router.post('/', requireOwner, validateBody(createCategorySchema), (req, res) => categoryController.createCategory(req, res));
router.patch('/:categoryId', requireOwner, validateBody(updateCategorySchema), (req, res) => categoryController.updateCategory(req, res));
router.delete('/:categoryId', requireOwner, (req, res) => categoryController.deleteCategory(req, res));

export default router;
