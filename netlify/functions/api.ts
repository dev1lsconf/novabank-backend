import { Handler, Context, Callback } from 'aws-lambda';
import { bootstrapServerless } from '../../src/serverless';

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  // Configurar para evitar congelación del event loop en ejecuciones serverless
  context.callbackWaitsForEmptyEventLoop = false;
  const server = await bootstrapServerless();
  return server(event, context, callback);
};
