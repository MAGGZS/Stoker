import { Router } from 'express';
import { itemController } from '../controllers/item.controller';
import { requireOwner } from '../middlewares/stockAccess';
import { validateBody, validateQuery } from '../middlewares/validate';
import { createItemSchema, updateItemSchema, queryItemsSchema } from '../validators/item.validator';

const router = Router({ mergeParams: true });

// Visualização permitida para DONO e CONVIDADO
router.get('/', validateQuery(queryItemsSchema), (req, res) => itemController.listItems(req, res));
router.get('/:itemId', (req, res) => itemController.getItemById(req, res));

// Criação, alteração e exclusão exigem nível DONO
router.post('/', requireOwner, validateBody(createItemSchema), (req, res) => itemController.createItem(req, res));
router.patch('/:itemId', requireOwner, validateBody(updateItemSchema), (req, res) => itemController.updateItem(req, res));
router.delete('/:itemId', requireOwner, (req, res) => itemController.deleteItem(req, res));

export default router;

