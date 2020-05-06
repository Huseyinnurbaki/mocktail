cd client
npm i
npm run build
cd ..
rm -rf build
cp -R ./client/build ./


# # Build
docker build -t hhaluk/mocktail .

# # Run
  docker run -p 7080:7080 -d hhaluk/mocktail

# # Push
#  docker push hhaluk/mocktail:latest



