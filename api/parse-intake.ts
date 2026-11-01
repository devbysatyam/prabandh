import { handleApiRequest } from '../src/api/handler';
import { createRoute } from './_lib/http';

export default createRoute('parse-intake', handleApiRequest);
