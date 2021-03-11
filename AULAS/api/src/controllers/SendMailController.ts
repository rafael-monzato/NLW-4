import { Request, Response } from "express"; 
import { resolve } from "path";
import { getCustomRepository} from "typeorm";
import { UsersRepository } from "../repositories/UsersRespository";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRespository";
import { SurveysRepository } from "../repositories/SurveysRespository";
import { AppError } from "./errors/AppError";
import SendMailServices from "../services/SendMailServices";



class SendMailController {
   async execute(request: Request, response: Response){
       const { email, survey_id} = request.body;
     
       const usersRepository = getCustomRepository(UsersRepository);
       const surveysRepository = getCustomRepository(SurveysRepository);
       const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

       const user = await usersRepository.findOne({email});

       if(!user) {
           throw new AppError("User does not exists", 400);
           
       }

      const survey = await surveysRepository.findOne({id: survey_id});

       if(!survey) {
        throw new AppError("Survey  does not exists!", 400);

        }

        
        
        const npsPath =  resolve(__dirname, "..", "views", "emails", "npsMail.hbs");

        const surveyUserAlredyExists = await surveysUsersRepository.findOne({
            where: {user_id: user.id, value: null},
            relations: ["user", "survey"],

        });

        const variables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            id: "",
            link: process.env.URL_MAIL
         
        };

        if(surveyUserAlredyExists) {
            variables.id = surveyUserAlredyExists.id;
            await SendMailServices.execute(email, survey.title, variables, npsPath);
            return response.json(surveyUserAlredyExists);
        }

           //Salvar informações na tabela surveyuser
        const surveyUser = surveysUsersRepository.create({
            user_id: user.id,
            survey_id
        });
        await surveysUsersRepository.save(surveyUser);
        //Enviar e-mail para o usuario
        variables.id = surveyUser.id;
        await SendMailServices.execute(email, survey.title, variables, npsPath);
        
        return response.json(surveyUser);


       }
   };




   export { SendMailController }