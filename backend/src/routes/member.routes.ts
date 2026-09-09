import { Router } from 'express';
import { memberController } from '../controllers/member.controller';
import { requireOwner } from '../middlewares/stockAccess';
import { validateBody } from '../middlewares/validate';
import { inviteMemberSchema, updateMemberRoleSchema } from '../validators/member.validator';

const router = Router({ mergeParams: true });

router.get('/', (req, res) => memberController.listMembers(req, res));
router.post('/invite', requireOwner, validateBody(inviteMemberSchema), (req, res) => memberController.createInvite(req, res));
router.patch('/:userId/role', requireOwner, validateBody(updateMemberRoleSchema), (req, res) => memberController.updateMemberRole(req, res));
router.delete('/:userId', requireOwner, (req, res) => memberController.removeMember(req, res));

export default router;

