#!/bin/sh
cat > src/environments/environment.development.ts <<EOF
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  googleMapsApiKey: '${GOOGLE_MAPS_API_KEY}',
};
EOF
exec npx ng serve --host 0.0.0.0
