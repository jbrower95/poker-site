use main
db.createUser({user:"test",pwd:"admin",roles:["readWrite"]});
db.createCollection("profiles");
// user is "test":"test"
db.profiles.insert({username: "test", salt: '123', email: "test@thenuts.com", pin: 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae', token: 'abcdef', startingStack: 100});
db.profiles.insert({username: "test2", salt: '123', email: "test2@thenuts.com", pin: 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae', token: 'abcdef2', startingStack: 100});
db.profiles.insert({username: "test3", salt: '123', email: "test3@thenuts.com", pin: 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae', token: 'abcdef3', startingStack: 100});
