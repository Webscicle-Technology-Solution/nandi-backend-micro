# Use the official nodejs V18 image with alpine linux as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# COPY Source and destination
# COPY all the package.json and if package.lock.json available that also to work directory
# lock file is used to leverage docker cache
COPY package*.json ./

# Install the dependencies excluding dev dependecies
# This helps keep docker image small
RUN npm ci --only=production

# Copy rest of app code to wrk directory
COPY . .

# Inform docker which port this container is listening on
EXPOSE 3003

# Specify the command to run on container start
CMD [ "node", "src/server.js" ]
