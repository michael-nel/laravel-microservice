<?php

namespace Tests\Feature\Models;

use App\Models\Genre;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;
use Tests\Traits\TestValidations;

class GenreTest extends TestCase
{
    use DatabaseMigrations, TestValidations;

    public function testList()
    {
        factory(Genre::class,1)->create();
        $genres = Genre::all();
        $this->assertCount(1,$genres);
        $genreKey = array_keys($genres->first()->getAttributes());
        $this->assertEqualsCanonicalizing([
            'id',
            'name',
            'created_at',
            'updated_at',
            'deleted_at',
            'is_active'
        ], $genreKey);
    }
    
    public function testCreate()
    {
        $genre = Genre::create([
            'name' =>  'test1'
        ]);
        $genre->refresh();
        $this->assertEquals('test1', $genre->name);
        $this->assertTrue($genre->is_active);

        $genre = Genre::create([
            'name' =>  'test1',
            'is_active' => false
        ]);
        $this->assertFalse( $genre->is_active);

        $genre = Genre::create([
            'name' =>  'test1',
            'is_active' => true
        ]);
        $this->assertTrue( $genre->is_active);
    }

    public function testUpdate()
    {
        $genre = factory(Genre::class)->create(
            ['is_active' => false])->first();
        $data = [
            'name' => 'test_name_updated',
            'is_active' => true
        ];
        $genre->update($data);

        foreach($data as $key=>$value){
            $this->assertEquals($value, $genre->{$key});
        }
    }

    public function testDelete(){
        $genre = factory(Genre::class,1)->create()->first();
        $genre->delete();
        $genres = Genre::all()->first();
        $this->assertNull($genres);
        $genre->restore();
        $this->assertNotNull(Genre::all()->first());
    }

    public function testUUID(){
        $genre = factory(Genre::class)->create()->first();
        $this->assertTrue($this->isValidUuid($genre->id));
    }

    protected function model()
    {
        // TODO: Implement model() method.
    }

    protected function routeStore()
    {
        // TODO: Implement routeStore() method.
    }

    protected function routeUpdate()
    {
        // TODO: Implement routeUpdate() method.
    }
}
