export async function handler(event) {
  console.log(event);
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Hello, User!`,
  };
}
