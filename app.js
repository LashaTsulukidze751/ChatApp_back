import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import pg from "pg";
import "dotenv/config";
const { Pool } = pg;

const app = express();

app.use(bodyParser.json());
app.use(cors());

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ChatApp',
  user: 'postgres',
  password: 'lasha',
});

app.get('/', async (req,res,next)=>{
    const client = await pool.connect();
    const result = await client.query('select (userid, username, email, password_hash, created_at) from users');
    console.log(result.rows)
    res.json(result.rows);
})


//message input
app.post('/', async (req, res , next)=>{
  const data = req.body;
  const client = await pool.connect();
  const result = await client.query(
    "INSERT INTO Messages (senderid, receiverid, content) VALUES ($1,$2,$3)",
    [data.senderid, data.reciverid, data.content]
  );
  res.status(200).send("message sent")
})



app.listen(4000,()=>{console.log(`app is listening on port 4000`)})