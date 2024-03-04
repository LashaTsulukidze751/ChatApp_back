import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const app = express();

app.use(bodyParser.json());
app.use(cors());

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "ChatApp",
  user: "postgres",
  password: "lasha",
});

//login
app.post("/main/login", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT userid FROM Users WHERE username=$1 AND password_hash=$2",
      [data.username, data.password_hash]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error });
  } finally {
    client.release();
  }
});

//registration
app.post("/reg", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try {
    const validation = check(data);
    if (validation.valid) {
      const result = await client.query(
        "INSERT INTO users (username, password_hash, email, usersurname, gender) VALUES ($1,$2,$3,$4,$5)",
        [
          data.username,
          data.password_hash,
          data.email,
          data.usersurname,
          data.gender,
        ]
      );
      res.status(200).json({
        message: validation.message,
        added: true,
      });
    } else {
      res.status(400).json({
        message: validation.message,
        added: false,
      });
    }
  } catch (error) {
    res.status(406).json({ message: "user already exists" });
  } finally {
    client.release();
  }
});

//reg check
const check = (data) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidCharacters = /[\';"]/;
  if (
    !data.username ||
    !data.email ||
    !data.password_hash ||
    !data.usersurname ||
    !data.gender
  ) {
    return { valid: false, message: "Not provided all data" };
  } else if (!emailRegex.test(data.email)) {
    return { valid: false, message: "Not valid Email" };
  } else if (!passwordRegex.test(data.password_hash)) {
    return { valid: false, message: "Incude special characters in password" };
  } else if (
    invalidCharacters.test(data.name) ||
    invalidCharacters.test(data.email) ||
    invalidCharacters.test(data.password_hash) ||
    invalidCharacters.test(data.surname)
  ) {
    return { valid: false, message: "sql injection" };
  } else {
    return { valid: true, message: "User added" };
  }
};

//get all users exept that who logged in
app.post("/main/chat", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT userid,username, usersurname, profileimage FROM Users WHERE userid != $1",
      [data.userid]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error });
  } finally {
    client.release();
  }
});

//get all messages
app.post("/main/chatroom", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM Messages WHERE (senderid = $1 AND receiverid =  $2)  OR (senderid =  $2 AND receiverid =  $1) ORDER BY timestamp",
      [data.user1, data.user2]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error });
  } finally {
    client.release();
  }
});

//message input
app.post("/main/chatroom/send", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      "INSERT INTO Messages (senderid, receiverid, content) VALUES ($1,$2,$3)",
      [data.senderid, data.receiverid, data.content]
    );
    res.status(200).json("message sent");
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  } finally {
    client.release();
  }
});

//get user information
app.post("/main/chatroom/users", async (req, res, next) => {
  const data = req.body;
  console.log(data.user);
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT userid, username, usersurname, profileimage FROM users WHERE userid = $1",
      [data.userid]
    );
    res.status(200).json(result.rows);
  } catch (eror) {
    console.log(eror);
    res.status(500).json({ eror });
  } finally {
    client.release();
  }
});



app.post("/main/userinfo", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      "select count(senderid) from messages where senderid = $1",
      [data.user]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error });
  } finally {
    client.release();
  }
});

app.delete("/main/chat/messages", async (req, res, next) => {
  const data = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      "DELETE FROM messages WHERE messageid = $1",
      [data.messageid]
    );
    res.status(200).send("succes");
  } catch (error) {
    res.status(500).json({ error });
  } finally {
    client.release();
  }
});

//get all profileimages
app.get('/main/chat',async (req,res,next)=>{
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM images",
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error });
  } finally {
    client.release();
  }
})

//update profile picture
app.put('/main/chat',async (req,res,next)=>{
  const data = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      "UPDATE users set profileimage=$1 where userid=$2 ",[data.url,data.userid]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error });
  } finally {
    client.release();
  }
})

app.listen(4000, () => {
  console.log(`app is listening on port 4000`);
});
