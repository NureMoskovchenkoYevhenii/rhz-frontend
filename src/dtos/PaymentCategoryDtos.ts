export interface PaymentCategoryDto {
    categoryID: number;
    name: string;
    description?: string; 
}

export interface PaymentCategoryForCreationDto {
    name: string;
    description?: string;
}

// src/dtos/PaymentCategoryDtos.ts


export interface PaymentCategoryForUpdateDto {
  name: string;            // Назва категорії (обов'язкова для оновлення)
  description?: string | null; // Опис категорії (опціонально)
}