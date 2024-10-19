const MatchingQueue = require('../service/matchingQueue')
const MatchController = require('../controllers/matchController')

const createMatchRequest = async (req, res) => {
    if (!(req.body.id)) {
        return res.status(400).json({ 'message': 'User ID is missing!' });
    }
    if (!(req.body.complexity)) {
        return res.status(400).json({ 'message': 'Complexity is not selected!' });
    }
    if (!(req.body.category)) {
        return res.status(400).json({ 'message': 'Category is not selected!' });
    }

    // Format required fields appropriately
    request = {
        id: req.body.id,
        complexity: req.body.complexity,
        category: req.body.category
    }

    await MatchingQueue.handleMatchRequest(request).then(matchedResult => {
        result = {
            matched: matchedResult.matched,
            matchedUserId: "",
            matchedUserName: "",
            category: matchedResult.category,
            complexity: matchedResult.complexity
        };

        if (matchedResult.matched) {
            //Make API call to check.
            const user1Name = "Test1";
            const user2Name = "Test2";
            if (req.body.id == matchedResult.user1) {
                //Only user1 save the data to the db
                MatchController.createMatch(matchedResult, user1Name, user2Name);
                result.matchedUserId = matchedResult.user2;
                result.matchedUserName = user2Name;
            } else {
                //User 2 just updates result
                result.matchedUserId = matchedResult.user1;
                result.matchedUserName = user1Name;
            }
        }
        // Return the result as 201 even if not matched.
        return res.status(201).json(result);

    }).catch(error => {
        console.log(`error`, error);
        return res.status(400).json({ 'message': 'Something went wrong during matching!' });
    });

}

const cancelMatchRequest = async (req, res) => {

    console.log(`Recieved cancel request for ${req.params.id}`);
    // Format required fields appropriately
    deleteResult = MatchingQueue.handleDeleteRequest({id: req.params.id});
    if (deleteResult) {        
        return res.status(200).json({'message': "Successfully cancelled matching request."});
    } else {
        return res.status(404).json({'message': "No matching reuqests found!"});
    }
}

module.exports = { createMatchRequest, cancelMatchRequest };