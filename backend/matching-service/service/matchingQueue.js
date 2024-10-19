const amqp = require('amqplib');

const reqCh = process.env.RABBITMQ_REQ_CH;
const resCh = process.env.RABBITMQ_RES_CH;

let requests = [];
let timeout = 30000;

const matchUsers = async () => {
    const connection = await amqp.connect(process.env.RABBITMQ_URI);
    const channel = await connection.createChannel();
    await channel.assertExchange(reqCh, 'fanout', { durable: false }); // A (fanout)
    await channel.assertExchange(resCh, 'topic', { durable: false }); // B (topic)

    const q = await channel.assertQueue('', { exclusive: true }) // Bind to A
    channel.bindQueue(q.queue, reqCh);


    //Waiting for user details to come in
    channel.consume(q.queue, msg => {

        const newRequest = JSON.parse(msg.content.toString());

        const findMatching = (goalScore) => {
            // Check if user is already in requests
            let inRequests = requests.some(req => req.id === newRequest.id)
            if (!inRequests && goalScore != 4) {
                console.log(`User ${newRequest.id} has already been matched or has cancelled queue. Terminating checks.`);
                return; // Skip adding this request
            };
            let matchScores = requests.slice().map((req) => calculateMatchScore(newRequest, req));
            matchScores.sort((a, b) => a.score - b.score); // Ascending order

            let viableMatches = matchScores.filter((req) => {
                console.log(JSON.stringify(req))
                return (req.score >= goalScore) && (req.otherId != newRequest.id)
            });
            let matchedRequest = false;

            if (viableMatches.length == 0 && !inRequests) {
                requests.push(newRequest);
            } else if (viableMatches.length > 0) {
                matchedRequest = viableMatches.pop()
            };

            if (matchedRequest) {
                requests.splice(requests.indexOf(matchedRequest), 1)
                result = {
                    matched: true,
                    user1: newRequest.id,
                    user2: matchedRequest.otherId,
                    category: matchedRequest.category,
                    complexity: matchedRequest.complexity
                };
                console.log(`Matched ${result.user1} and ${result.user2}`);
                channel.publish(resCh, newRequest.id, Buffer.from(JSON.stringify(result))); // B to D
                channel.publish(resCh, matchedRequest.otherId, Buffer.from(JSON.stringify(result)));
            };

            
            setTimeout(() => {
                if (goalScore > 2.5 && !matchedRequest) {
                    findMatching(goalScore - 0.5)
                }
            }, timeout / 5);

        }

        findMatching(4)

        setTimeout(() => {
            if (handleDeleteRequest(newRequest)) {
                result = {
                    matched: false,
                    user1: newRequest.id,
                    user2: "",
                    category: [],
                    complexity: ""
                };
                channel.publish(resCh, newRequest.id, Buffer.from(JSON.stringify(result))); //B to D
                console.log(`${newRequest.id} timed out.`)
            }
        }, timeout);
    }, { noAck: true });

    console.log("Matching queues initalized.");
}

// Prototype function for possible implementation
const calculateMatchScore = (newRequest, otherRequest) => {
    let matchScore = 0;

    // Look for at least one matching category
    matchingCategories = newRequest.category.filter(category => otherRequest.category.includes(category));
    if (matchingCategories.length != 0) {
        matchScore += 2;
    };

    // Look for close complexity levels
    const complexityLevels = {
        "Easy": 1,
        "Medium": 2,
        "Hard": 3
    };
    const complexityNumbers = {
        1: "Easy",
        2: "Medium",
        3: "Hard"
    };
    const complexityLevel1 = complexityLevels[newRequest.complexity];
    const complexityLevel2 = complexityLevels[otherRequest.complexity];
    matchedComplexity = "Easy"

    // Close match
    if (Math.abs(complexityLevel1 - complexityLevel2) <= 1) {
        matchScore += 1
        if (complexityLevel1 < complexityLevel2) {
            matchedComplexity = complexityNumbers[complexityLevel1];
        } else {
            matchedComplexity = complexityNumbers[complexityLevel2];
        };
    }

    // Exact match
    if (complexityLevel1 === complexityLevel2) {
        matchScore += 1;
    }

    if (newRequest.id === otherRequest.id) {
        matchScore = -10
    }

    result = { 
        score: matchScore, 
        category: matchingCategories[0], 
        complexity: matchedComplexity,
        otherId: otherRequest.id 
    };
    // console.log(`Comparison results = ${JSON.stringify(result)}`)

    return result 
}


const handleMatchRequest = async (request) => {
    const connection = await amqp.connect(process.env.RABBITMQ_URI);
    const channel = await connection.createChannel();
    await channel.assertExchange(reqCh, 'fanout', { durable: false });  // C (fanout)
    await channel.assertExchange(resCh, 'topic', { durable: false });  // D (topic)

    const q = await channel.assertQueue('', { exclusive: true }) // Bind to D
    channel.bindQueue(q.queue, resCh, request.id);

    //Sending user details
    channel.publish(reqCh, '', Buffer.from(JSON.stringify(request))); // C to A
    console.log(`Sent user ${request.id} for matching.`);

    //Promise
    return new Promise((resolve, reject) => {
        let received = false;
        // Consume the result from the queue
        channel.consume(q.queue, msg => {
            console.log(`User ${request.id} ~ Result: ${msg.content.toString()}`);
            result = JSON.parse(msg.content.toString());
            connection.close();
            received = true;
            resolve(result); 
        }, { noAck: true });

        // Timeout after 45 seconds if no response is received (failsafe).
        setTimeout(() => {
            if (!received) {
                console.log(`45 seconds timeout for matching user ${request.id}`);
                connection.close();
                resolve({
                    matched: false,
                    user1: "",
                    user2: "",
                    category: request.category,
                    complexity: request.complexity
                });
            }
        }, 45000);
    });

}

const handleDeleteRequest = (user) => {
    if (requests.filter(request => request.id == user.id).length != 0) {
        requests = requests.filter(request => request.id !== user.id);
        console.log(`Match request for user ${user.id} deleted.`)
        return true;
    }
    return false;
}

module.exports = { matchUsers, handleMatchRequest, handleDeleteRequest };