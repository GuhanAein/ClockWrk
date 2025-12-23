# AWS Deployment Guide

This guide explains how to deploy the TickTick Clone (ClockWrk) to AWS using the following architecture:
**User -> CloudFront -> S3 (Frontend) -> HTTPS -> Elastic Beanstalk (Backend) -> RDS (Database)**

## 1. Prerequisites
- An AWS Account.
- AWS CLI installed and configured (optional, but helpful).
- A domain name (optional, but recommended for HTTPS on both ends).

---

## 2. Database Setup (RDS)
1.  Go to the **RDS Console** in AWS.
2.  **Create Database**:
    -   **Engine**: PostgreSQL.
    -   **Template**: Free Tier (if eligible).
    -   **Settings**: set a Master Username (e.g., `postgres`) and Password.
    -   **Connectivity**:
        -   **Public access**: No (secure) or Yes (if you need to debug from local machine, restrict by IP).
        -   **VPC Security Group**: Create a new one. Allow inbound traffic on port `5432` from "Anywhere" (temporarily) or strictly from your Security Group.
3.  Once created, note down the **Endpoint** (e.g., `clockwrk-db.cxyz.us-east-1.rds.amazonaws.com`).

---

## 3. Backend Deployment (Elastic Beanstalk)
The backend is a Spring Boot application packaged as a JAR file.

### A. Prepare the Build
1.  Navigate to `backend/`.
2.  Run `mvn clean package -DskipTests`.
3.  Locate `backend/target/clockWork-0.0.1-SNAPSHOT.jar`.

### B. Create Elastic Beanstalk Application
1.  Go to **Elastic Beanstalk Console**.
2.  **Create Application** -> Name: `clockwrk-backend`.
3.  **Platform**: Java (Corretto 21 or Java 21 AL2023).
4.  **Application Code**: Upload the JAR file generated in step A.
5.  **Configuration** (Configure updates > Environment properties):
    Add the following Environment Properties (Environment Variables):
    -   `SERVER_PORT`: `5000` (Standard for EB) or `8080`.
    -   `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<RDS_ENDPOINT>:5432/postgres` (Replace with your RDS endpoint).
    -   `SPRING_DATASOURCE_USERNAME`: Your RDS username.
    -   `SPRING_DATASOURCE_PASSWORD`: Your RDS master password.
    -   `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
    -   `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.
    -   `JWT_SECRET`: Your generated JWT secret.
    -   `MAIL_USERNAME`: Your Gmail address.
    -   `MAIL_PASSWORD`: Your Gmail App Password.
    -   `APP_FRONTEND_URL`: *Leave placeholder for now* (e.g. `http://localhost`). We will update this after Frontend deployment.
6.  **Create Environment**.
7.  Once deployed, note the **Environment URL** (e.g., `clockwrk-env.eba-xyz.us-east-1.elasticbeanstalk.com`).
    *   *Note: By default, this is HTTP. For HTTPS, you need to configure a Load Balancer with an ACM Certificate.*

---

## 4. Frontend Deployment (S3 + CloudFront)

### A. Update Configuration
1.  Open `frontend/src/environments/environment.prod.ts`.
2.  Update `baseUrl` and `apiUrl` with your **backend Environment URL**.
    ```typescript
    export const environment = {
      production: true,
      baseUrl: 'http://clockwrk-env.eba-xyz.us-east-1.elasticbeanstalk.com', // Use HTTPS if configured
      apiUrl: 'http://clockwrk-env.eba-xyz.us-east-1.elasticbeanstalk.com/api'
    };
    ```

### B. Build the Application
1.  Navigate to `frontend/`.
2.  Run `npm install`.
3.  Run `npm run build -- --configuration=production`.
4.  The artifacts will be in `frontend/dist/clockwrk/browser`.

### C. Upload to S3
1.  Go to **S3 Console**.
2.  **Create Bucket** (e.g., `clockwrk-frontend`).
3.  Uncheck "Block all public access" (if you want to test S3 directly) OR keep it blocked and use CloudFront OAC (recommended for security).
4.  Upload **all files and folders** from `dist/clockwrk/browser` into the bucket.

### D. Setup CloudFront
1.  Go to **CloudFront Console**.
2.  **Create Distribution**.
3.  **Origin Domain**: Select your S3 bucket.
4.  **Origin Access Control (OAC)**: Create new OAC and select "Update the S3 bucket policy" (AWS will give you a policy to copy-paste into S3 permissions).
5.  **Viewer Protocol Policy**: Redirect HTTP to HTTPS.
6.  **Price Class**: Use All Edge Locations (or Use North America and Europe for lower cost).
7.  **Error Pages** (Crucial for Angular SPA):
    -   Create Custom Error Response.
    -   **HTTP Error Code**: `403` and `404`.
    -   **Customize Error Response**: Yes.
    -   **Response Page Path**: `/index.html`.
    -   **HTTP Response Code**: `200`.
8.  **Create Distribution**.
9.  Note the **CloudFront Domain Name** (e.g., `d12345.cloudfront.net`).

---

## 5. Final Wiring
1.  **Update Backend**:
    -   Go back to **Elastic Beanstalk**.
    -   Update the `APP_FRONTEND_URL` environment variable to `https://<YOUR_CLOUDFRONT_DOMAIN>`.
    -   Apply configuration.
2.  **Update Google Console**:
    -   Add `https://<YOUR_CLOUDFRONT_DOMAIN>` to Authorized JavaScript origins.
    -   Add `http://<YOUR_BACKEND_URL>/login/oauth2/code/google` (and HTTPS version) to Authorized Redirect URIs.

## 6. HTTPS for Backend (Optional but Recommended)
To secure the backend (remove "Not Secure" warnings):
1.  Obtain a certificate in **AWS ACM** (Certificate Manager) for your custom domain (e.g., `api.yourdomain.com`).
2.  In Elastic Beanstalk -> Configuration -> Load balancer.
3.  Add a generic HTTPS listener on port 443.
4.  Select your ACM certificate.
5.  Update your frontend `environment.prod.ts` to use `https://api.yourdomain.com`.
