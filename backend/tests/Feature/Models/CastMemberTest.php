<?php


namespace Models;

use App\Models\CastMember;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;
use Tests\Traits\TestValidations;

class CastMemberTest extends TestCase
{
    use DatabaseMigrations, TestValidations;

    public function testList()
    {
        factory(CastMember::class,1)->create();
        $castMembers = CastMember::all();
        $this->assertCount(1,$castMembers);
        $castMemberKey = array_keys($castMembers->first()->getAttributes());
        $this->assertEqualsCanonicalizing([
            'id',
            'name',
            'type',
            'created_at',
            'updated_at',
            'deleted_at',
        ], $castMemberKey);
    }

    public function testCreate()
    {
        $castMember = CastMember::create([
            'name' =>  'test1',
            'type' => CastMember::TYPE_DIRECTOR
        ]);
        $castMember->refresh();
        $this->assertEquals('test1', $castMember->name);
        $this->assertEquals(1, $castMember->type);


        $category = CastMember::create([
            'name' =>  'test1',
            'type' => CastMember::TYPE_ACTOR
        ]);
        $this->assertEquals($category->type, CastMember::TYPE_ACTOR);
    }

    public function testUpdate()
    {
        /** @var CastMember $castMember */
        $castMember = factory(CastMember::class)->create(
            ['name'=>'test_cast_member',
                'type' => CastMember::TYPE_DIRECTOR])->first();
        $data = [
            'name' => 'test_cast_updated',
            'type' => CastMember::TYPE_ACTOR
        ];

        $castMember->update($data);

        foreach($data as $key=>$value){
            $this->assertEquals($value, $castMember->{$key});
        }
    }

    public function testDelete(){
        /** @var CastMember $castmember */
        $castMember = factory(CastMember::class,1)->create()->first();
        $castMember->delete();
        $castMembers = CastMember::all()->first();
        $this->assertNull($castMembers);
        $castMember->restore();
        $this->assertNotNull(CastMember::all()->first());
    }

    public function testUUID(){
        /** @var Castmember $castMember */
        $castMember = factory(Castmember::class)->create()->first();
        $this->assertTrue($this->isValidUuid($castMember->id));
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
