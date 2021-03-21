cd client
# npm i
npm run build
cd ..
rm -rf build
cp -R ./client/build ./


# # Build
# docker build -t hhaluk/mocktail .

docker build -t hhaluk/mocktail:latest -t hhaluk/mocktail:v1.0.3 .

# # Run
  docker run -p 7080:7080 hhaluk/mocktail

# # Push
#  docker push hhaluk/mocktail:latest
#  docker push hhaluk/mocktail:v1.0.3



