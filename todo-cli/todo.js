
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
    let output = ""
    list.forEach((item, index) => {
      output += `[${item.completed ? 'x' : ' '}] ${item.title}`
      if (item.dueDate!== today) {
        output += ` ${item.dueDate}`
      }
      output +="\n"
    })
    return output
  }
  const formattedDate = (date) => {
  return date.toISOString().split("T")[0]
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
todos.add({ title: 'Service vehicle', dueDate: today, completed: false })
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


