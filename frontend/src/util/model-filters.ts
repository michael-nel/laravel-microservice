import {Category, Genre} from './model';

export function getGenresFromCategory(genres: Genre[],category: Category){
    return genres.filter(
        genre => genre.categories.filter(cat => cat.id === category.id).length !== 0
    )
}