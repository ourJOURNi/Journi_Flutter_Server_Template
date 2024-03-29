export {};
const mongoose = require('mongoose');

const ProgramSchema: any = new mongoose.Schema(
    {
      title: {
        type: String,
        maxlength: 100,
      },
      date: {
        type: String,
        maxlength: 50,
      },
      summary: {
        type: String,
        maxlength: 200,
      },
      category: {
        type: String,
        maxlength: 30,
      },
      details: {
        type: String,
        maxlength: 800,
      },
      photo: {
        type: String,
        maxlength: 800,
      }
  });

  
  const Program = mongoose.model('Program', ProgramSchema);
  module.exports = Program;