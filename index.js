const express = require("express");
const { MongoClient } = require("mongodb");

const ObjectId = require("mongodb").ObjectId;

require("dotenv").config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// // -------------mongodb-------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.knujv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

async function run() {
	try {
		await client.connect();
		console.log("connected to database");

		const database = client.db("ghurteJai");
		const serviceCollection = database.collection("services");
		const orderCollection = database.collection("myorder");
		const packageCollection = database.collection("packages");
		const addServiceCollection = database.collection("addservice");

		// GET API
		app.get("/services", async (req, res) => {
			const cursor = serviceCollection.find({});
			const service = await cursor.toArray();
			res.send(service);
		});
		app.get("/packages", async (req, res) => {
			const cursor = serviceCollection.find({});
			const package = await cursor.toArray();
			res.send(package);
		});

		app.get("/orders", async (req, res) => {
			const cursor = orderCollection.find({});
			const order = await cursor.toArray();
			res.send(order);
		});
		// GET SINGLE Unique service
		app.get("/services/:id", async (req, res) => {
			const id = req.params.id;
			console.log("getting specific service", id);
			const query = { _id: ObjectId(id) };
			const service = await serviceCollection.findOne(query);
			res.json(service);
		});
		//  POST API

		app.post("/services", async (req, res) => {
			const service = req.body;
			console.log("hit the post api from service", service);

			const result = await orderCollection.insertOne(service);
			// alert('service added successfully')
			console.log(result);
			res.json(result);
		});

		// Delete
		app.delete("/orders/:id", async (req, res) => {
			const id = req.params.id;
			console.log("get delete request", id);
			const query = { _id: ObjectId(id) };
			const result = await orderCollection.deleteOne(query);
			console.log("service deleted successfully", result);
			res.json(result);
		});

		// update api
		app.put("orders/:id", async (req, res) => {
			const id = req.params.id;
			console.log("get update request", id);
		});

		app.get("/myorder/:email", async (req, res) => {
			const email = req.params.email;
			console.log("getting specific orders querry", email);
			const query = { email: email };
			const cursor = orderCollection.find(query);
			if ((await cursor.count()) === 0) {
				console.log("Data Not found!!!!");
			}

			const result = await cursor.toArray();
			res.send(result);
		});

		// add new services
		app.post("/addservice", async (req, res) => {
			const addservice = req.body;
			console.log("hit the post api from addservice", addservice);

			const result = await serviceCollection.insertOne(addservice);

			console.log(result);
			res.json(result);
		});
		// get for addservice data from database
		app.get("/addservice", async (req, res) => {
			const cursor = serviceCollection.find({});
			const addService = await cursor.toArray();
			res.send(addService);
		});
	} finally {
		// await client.close();
	}
}
run().catch(console.dir);

app.get("/", (req, res) => {
	res.send("running server now ghurte jai");
});
app.listen(port, () => {
	console.log("running  server on port", port);
});