export {};
import { format } from 'date-fns'
const Program = require('../models/programs.model.ts');

interface Program {
    title: string,
    date: string,
    summary: string,
    details: string,
}

exports.getAllPrograms = (req: any, res: any) => {
  let email = req.body.email;
  console.log('Attempting to get all Programs ...')
  Program.find(
    (err: Error, programs: any) => {
      if(err) res.status(401).json(err);
      if(!programs) res.status(400).json({msg: 'No Programs Array found! Check Program Model'});
      if(programs) {
        if(programs.length == 0) console.log('No programs saved.')
        res.status(200).json(programs)
      };
    }
  )
}

exports.getProgramInfo = (req: any, res: any) => {
  let id = req.body._id;
  console.log('Attempting to get all Program Info ...')
  Program.findOne(
    {_id: id},
    (err: Error, programs: any) => {
      if(err) res.status(401).json(err);
      if(!programs) res.status(400).json({msg: 'No Programs Array found! Check Program Model'});
      if(programs) {
        if(programs.length == 0) console.log('No programs found.')
        console.log(programs);
        res.status(200).json(programs)
      };
    }
  )
}

exports.addProgram = (req: any, res: any) => {
  let title = req.body.title;
  let date = req.body.date;
  let summary = req.body.summary;
  let details = req.body.details;
  console.log('Attempting add a Program ...');

  let newProgram = Program({
    title,
    date,
    summary,
    details
    });
    // Save Object
    newProgram.save((err: Error, newProgram: Program) => {
    if (err) {
        console.log(err)
        return res.status(400).json({ 'msg': err });
    }
    if (!newProgram) {
        console.log('There was no Program saved!')
        return res.status(400).json({ msg: 'There was no Program saved!' });
    }
    console.log('Program Saved!');
    return res.status(200).json(newProgram);
    });
}

exports.editProgram = (req: any, res: any) => {
  let id = req.body._id;
  let title = req.body.title;
  let date = req.body.date;
  let summary = req.body.summary;
  let details = req.body.details;

  console.log('Attempting to Edit a Program ...');
  Program.updateOne(
    {_id: id},
    {
        title,
        date,
        summary,
        details
    },
    (err: Error, programs: any) => {
      if(err) res.status(401).json(err);
      if(!programs) res.status(400).json({msg: 'No Programs Array found! Check Program Model'});
      if(programs) {
        if(programs.length == 0) console.log('No programs saved.')
        res.status(200).json(programs)
      };
    }
  )
}

exports.deleteProgram = (req: any, res: any) => {
    let id = req.body._id;
    console.log('Attempting to Delete a Program ...')
    Program.deleteOne(
        {_id: id},
        (err: Error, programs: any) => {
          if(err) res.status(401).json(err);
          if(!programs) res.status(400).json({msg: 'No Programs Array found! Check Program Model'});
          if(programs) {
            if(programs.length == 0) console.log('No programs found.')
            res.status(200).json(programs)
          };
        }
  )
}

