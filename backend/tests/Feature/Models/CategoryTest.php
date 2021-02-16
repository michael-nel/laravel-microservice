<?php

namespace Tests\Feature\Models;

use App\Models\Category;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Traits\TestValidations;

class CategoryTest extends TestCase
{
    use DatabaseMigrations, TestValidations;

    public function testList()
    {
        factory(Category::class,1)->create();
        $categories = Category::all();
        $this->assertCount(1,$categories);
        $categoryKey = array_keys($categories->first()->getAttributes());
        $this->assertEqualsCanonicalizing([
            'id',
            'name',
            'description',
            'created_at',
            'updated_at',
            'deleted_at',
            'is_active'
        ], $categoryKey);
    }
    public function testCreate()
    {
        $category = Category::create([
            'name' =>  'test1'
        ]);
        $category->refresh();
        $this->assertEquals('test1', $category->name);
        $this->assertNull($category->description);
        $this->assertTrue((bool)$category->is_active);

        $category = Category::create([
            'name' =>  'test1',
            'description' => null
        ]);
        $this->assertNull($category->description);

        $category = Category::create([
            'name' =>  'test1',
            'description' => 'test_description'
        ]);
        $this->assertEquals('test_description', $category->description);

        $category = Category::create([
            'name' =>  'test1',
            'is_active' => false
        ]);
        $this->assertFalse( $category->is_active);

        $category = Category::create([
            'name' =>  'test1',
            'is_active' => true
        ]);
        $this->assertTrue( $category->is_active);
    }

    public function testUpdate()
    {
        /** @var Category $category */
        $category = factory(Category::class)->create(
            ['description'=>'test_description',
             'is_active' => false])->first();
        $data = [
            'name' => 'test_name_updated',
            'description' => 'test_description_updated',
            'is_active' => true
        ];
        $category->update($data);

        foreach($data as $key=>$value){
            $this->assertEquals($value, $category->{$key});
        }
    }

    public function testDelete(){
        /** @var Category $category */
        $category = factory(Category::class,1)->create()->first();
        $category->delete();
        $categories = Category::all()->first();
        $this->assertNull($categories);
        $category->restore();
        $this->assertNotNull(Category::all()->first());
    }

    public function testUUID(){
        /** @var Category $category */
        $category = factory(Category::class)->create()->first();
        $this->assertTrue($this->isValidUuid($category->id));
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
