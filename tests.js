let mydict = {"user1": "1234", "user3": "123"};
// mydict["user1"] = "1234";
// mydict["user2"] = "asdf";
// mydict["user3"] = "qqqq";

console.log(mydict)
if (mydict["user3"] === "qqqq") {
    console.log("OK");
} else {
    console.log("NOT OK");
}
