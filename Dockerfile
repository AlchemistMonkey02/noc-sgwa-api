FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# Install dependencies (production only to save space, or all if build process needs devDependencies)
RUN npm install

# Bundle app source
COPY . .

# Expose port
EXPOSE 5000

# Start command (using basic node start, or npm start if it uses nodemon which is fine for dev containers)
CMD [ "npm", "start" ]
