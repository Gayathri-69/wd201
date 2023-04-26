// eslint-disable-next-line no-unused-vars
const {connect}=require("./connectDB.js");
const Todo =require("./Todomodel.js");

const createTodo=async()=>{
    try{
        await connect();
        const todo =await Todo.addTask({
            title:"Second Item",
            dueDate:new Date(),
            completed: false,
        });
        console.log(`Created todo with ID:${todo.id}`);

    }catch(error){
        console.error(error);
    }
};
(async ()=>{
    await createTodo();
})();