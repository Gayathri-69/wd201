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
      return this.update({ completed: completed });
    }
    static getTodos() {
      return this.findAll();
    }

    static async getCompleted(){
      return this.findAll({
        where:{
          completed:{
            [Op.eq]: true,
          }
          },
          
      });
    }

    static getoverdueTodos() {
      const date = new Date();
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: date,
          },
          completed:{
            [Op.eq]: false,
          },
        },
      });
    }
    static getdueTodayTodos() {
      const date = new Date();
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: date,
          },
          completed:{
            [Op.eq]: false,
          },
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
      const date = new Date();
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: date,
          },
          completed:{
            [Op.eq]: false,
          },
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
