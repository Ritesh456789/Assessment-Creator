import { Router } from 'express';

import { assessmentsRouter } from './assessments';

export const apiRouter = Router();

apiRouter.get('/health', (_, response) => response.json({ status: 'ok' }));
apiRouter.use('/assessments', assessmentsRouter);export {};
