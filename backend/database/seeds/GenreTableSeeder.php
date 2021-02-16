<?php

use Illuminate\Database\Seeder;

use App\Models\Category;
use App\Models\Genre;

class GenreTableSeeder extends Seeder
{

    public function run()
    {
        $categories = Category::all();
        factory(Genre::class,10)
            ->create()
            ->each(function(Genre $genre) use($categories){
                $categoriesId = $categories->random(5)->pluck('id')->toArray();
                $genre->categories()->attach($categoriesId);
            });
    }
}
