import express from 'express';
import * as authService from './auth.service.js';

export const register=async(req,res)=>{

    try {
        const user=await authService.registerUser(req.body);
        res.status(201).json({
            message:"User registered successfully",
            user:user
        });
    } catch (error) {
        res.status(500).json({message:"Error registering user",error:error.message});
    }
    
}
export const login=async(req,res)=>{
    try {
        const token=await authService.loginUser(req.body);
        res.status(200).json({
            message:"User logged in successfully",
            token:token
        });
    } catch (error) {
        res.status(401).json({message:"Error logging in",error:error.message});
    }   
}