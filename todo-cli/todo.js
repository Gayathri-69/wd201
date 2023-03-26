const todoList = () => {
  all = []
  const add = (todoItem) => {
    all.push(todoItem)
  }
  const markAsComplete = (index) => {
    all[index].completed = true
  }

  const overdue = () => {
    const today = new Date().toISOString().slice(0, 10)
    return all.filter(item => item.dueDate < today )
  }

  const dueToday = () => {
    const today = new Date().toISOString().slice(0, 10)
    return all.filter(item => item.dueDate === today )
  }

  const dueLater = () => {
    return all.filter(item => item.dueDate > today )
  }

  const toDisplayableList = (list) => {
    return list.map((item) => {
      const prefix = item.completed ? "[x]" : "[ ]"
      const date = item.dueDate === new Date().toISOString().split("T")[0] ? "" : ` ${item.dueDate}`
      return `${prefix} ${item.title}${date}`
    }).join("\n")
    
  }
  


  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList
  };
};

const todos = todoList();

const formattedDate = d => {
  return d.toISOString().split("T")[0]
}

const today = formattedDate(new Date())
const yesterday = formattedDate(new Date(new Date().setDate(new Date().getDate() - 1)))
const tomorrow = formattedDate(new Date(new Date().setDate(new Date().getDate() + 1)))

todos.add({ title: 'Submit assignment', dueDate: yesterday, completed: false })
todos.add({ title: 'Pay rent', dueDate: today, completed: true })
todos.add({ title: 'Service Vehicle', dueDate: today, completed: false })
todos.add({ title: 'File taxes', dueDate: tomorrow, completed: false })
todos.add({ title: 'Pay electric bill', dueDate: tomorrow, completed: false })

console.log("My Todo-list\n")

console.log("Overdue")
const overdueItems = todos.overdue()
const formattedOverdueItems = todos.toDisplayableList(overdueItems)
console.log(formattedOverdueItems)
console.log("\n")

console.log("Due Today")
const dueTodayItems = todos.dueToday()
const formattedDueTodayItems = todos.toDisplayableList(dueTodayItems)
console.log(formattedDueTodayItems)
console.log("\n")

console.log("Due Later")
const dueLaterItems = todos.dueLater()
const formattedDueLaterItems = todos.toDisplayableList(dueLaterItems)
console.log(formattedDueLaterItems)
console.log("\n")

