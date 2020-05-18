let app_url = "/"
if (process.env.NODE_ENV === "development") {
  app_url = "http://localhost:7080/"
}
export default app_url
