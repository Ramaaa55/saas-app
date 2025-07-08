import React, { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    throw new Error('Error de prueba para Sentry');
  }, []);

  return <div>Hola Clarimap</div>;
}
