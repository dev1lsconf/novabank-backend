import 'reflect-metadata';
import { Handler, Context, Callback } from 'aws-lambda';
import { bootstrapServerless } from '../../src/serverless';

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // 1. Normalizar el path eliminando el prefijo interno de Netlify Functions si está presente
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace(/^\/\.netlify\/functions\/api/, '') || '/';
  }
  if (event.rawPath && event.rawPath.startsWith('/.netlify/functions/api')) {
    event.rawPath = event.rawPath.replace(/^\/\.netlify\/functions\/api/, '') || '/';
  }

  // 2. Garantizar estructura estándar AWS API Gateway para @codegenie/serverless-express
  if (!event.requestContext) {
    event.requestContext = {};
  }
  if (!event.requestContext.httpMethod) {
    event.requestContext.httpMethod = event.httpMethod || 'GET';
  }
  if (!event.requestContext.path) {
    event.requestContext.path = event.path || '/';
  }
  if (!event.requestContext.protocol) {
    event.requestContext.protocol = 'HTTP/1.1';
  }
  if (!event.requestContext.stage) {
    event.requestContext.stage = 'prod';
  }

  try {
    const server = await bootstrapServerless();
    return await server(event, context, callback);
  } catch (error: any) {
    console.error('❌ Error en el handler serverless:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        statusCode: 500,
        error: 'Internal Server Error',
        message: error?.message || 'Error en el arranque de la función serverless',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
