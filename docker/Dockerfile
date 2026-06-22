# Single-stage static file server for Math Lab.
# No build step: the game is plain HTML + vendored ESM + assets.
FROM nginx:alpine

# Replace the default nginx site config with ours (adds the .mjs MIME fix,
# nosniff, server_tokens off, and the try_files fallback).
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy ONLY the static set into the web root. src/ is flattened to the root so
# production URLs are clean (/, /main.js) and the ../lib import resolves to a
# sibling lib/ — identical to dev (`cd src && python3 -m http.server`).
# Never copy .git, archive/, .planning/, or the docker/ config into the image
# (info-disclosure mitigation T-07-02).
COPY src/ /usr/share/nginx/html/
COPY lib/ /usr/share/nginx/html/lib/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80
# No CMD override — nginx:alpine already runs nginx in the foreground.
