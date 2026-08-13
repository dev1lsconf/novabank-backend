import 'reflect-metadata';
import { Handler, Context, Callback } from 'aws-lambda';
import { bootstrapServerless } from '../../src/serverless';

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  // Normalizar el path eliminando el prefijo de Netlify Functions si está presente
  if (event.path && event.path.startsWith('/.netlify/functions/api')) {
    event.path = event.path.replace(/^\/\.netlify\/functions\/api/, '') || '/';
  }
  if (event.rawPath && event.rawPath.startsWith('/.netlify/functions/api')) {
    event.rawPath = event.rawPath.replace(/^\/\.netlify\/functions\/api/, '') || '/';
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
