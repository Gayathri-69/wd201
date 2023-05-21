/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Todo.belongsTo(models.User,{
        foreignKey:'userId'
      })
      // define association here
    }
    static addTodo({ title, dueDate }) {
      if (!title) {
        throw new Error("Title is required.");
      }
      if (!dueDate) {
        throw new Error("Due date is required.");
      }
      return this.create({ title: title, dueDate: dueDate, completed: false });
    }
    setCompletionStatus(completed) {
      let r = completed;
      return this.update({ completed: r });
    }
    static getTodos() {
      return this.findAll();
    }

    static async getCompleted() {
      return this.findAll({
        where: {
          completed: true,
        },
      });
    }

    static getoverdueTodos() {
      let date = new Date().toISOString().split("T")[0];
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: date,
          },
          completed: {
            [Op.eq]: false,
          },
        },
      });
    }
    static getdueTodayTodos() {
      let date = new Date().toISOString().split("T")[0];
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: date,
          },
          completed: false,
        },
      });
    }
    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
    static getdueLaterTodos() {
      let date = new Date().toISOString().split("T")[0];
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: date,
          },
          completed: false,
        },
      });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
