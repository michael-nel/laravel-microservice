<?php

namespace Tests\Stubs\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;

class GenreStub extends Model
{
    use SoftDeletes;
    protected $table = 'genre_stubs';
    protected  $fillable = ['name','is_active'];

    public static function createTable(){
        \Schema::create('genre_stubs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->boolean('is_active');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public static function dropTable(){
        \Schema::dropIfExists('genre_stubs');
    }
}
