<?php


namespace Models;

use App\Models\Genre;
use App\Models\Traits\Uuid;
use App\Models\Traits\UploadFiles;
use App\Models\Video;
use Illuminate\Database\Eloquent\SoftDeletes;
use Tests\TestCase;

class VideoUnitTest extends TestCase
{
    private $video;

    protected  function setUp(): void
    {
        parent::setUp();
        $this->video = new Video();
    }

    public function testFillableAttribute()
    {
        $fillable = ['title',
                     'description',
                     'year_launched',
                     'opened',
                     'rating',
                     'duration',
                     'thumb_file',
                     'banner_file',
                     'trailer_file',
                     'video_file',
                     ];
        $this->assertEquals($fillable,$this->video->getFillable());
    }

    public function testIfUseTraits(){
        $traits = [
            SoftDeletes::class, Uuid::class,UploadFiles::class
        ];
        $videoTraits = array_keys(class_uses(Video::class));
        $this->assertEquals($traits, $videoTraits);
    }

    public function testDatesAttribute(){
        $dates = [ 'deleted_at', 'created_at', 'updated_at'];
        foreach($dates as $date){
            $this->assertContains($date, $this->video->getDates());
        }
        $this->assertCount(count($dates), $this->video->getDates());
    }

    public function testCatsAttribute()
    {
        $casts = ['id' => 'string',
                  'opened' => 'boolean',
                  'year_launched' => 'integer',
                  'duration' => 'integer' ];
        $this->assertEquals($casts ,$this->video->getCasts());
    }

    public function testIncrementing(){
        $this->assertFalse(false, $this->video->incrementing);
    }
}
