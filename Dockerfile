# Use an official Nginx runtime as a parent image
FROM nginx:alpine

# Set the working directory (optional, but good practice)
WORKDIR /usr/share/nginx/html

# Remove default Nginx welcome page
RUN rm -f index.html default.conf

# Copy the static files from your project into the Nginx HTML directory
COPY index.html .
COPY style.css .
COPY script.js .
# If you have other assets (images, etc.), copy them too:
# COPY images/ ./images/

# Expose port 80 (Nginx default port)
EXPOSE 80

# Command to run Nginx in the foreground when the container starts
CMD ["nginx", "-g", "daemon off;"]
