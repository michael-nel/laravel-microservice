<?php

namespace Models;

use App\Models\Video;
use App\Models\Genre;
use App\Models\Category;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;
use Tests\Traits\TestValidations;
use Illuminate\Database\QueryException;
use Illuminate\Http\UploadedFile;
use Illuminate\Database\Events\TransactionCommitted;
use Tests\Exceptions\TestException;

class VideoTest extends TestCase
{
    use DatabaseMigrations;

    private $data;

    protected function setUp(): void
    {
        parent::setUp();
        $this->data = [
            'title' => 'title',
            'description' => 'description',
            'year_launched' => 2010,
            'rating' => Video::RATING_LIST[0],
            'duration' => 90,
        ];
    }

    public function testList()
    {
        factory(Video::class,1)->create();
        $videos = Video::all();
        $this->assertCount(1,$videos);
        $videoKey = array_keys($videos->first()->getAttributes());
        $this->assertEqualsCanonicalizing([
            'id',
            'title',
            'description',
            'year_launched',
            'opened',
            'rating',
            'duration',
            'thumb_file',
            'banner_file',
            'trailer_file',
            'video_file',
            'created_at',
            'updated_at',
            'deleted_at'
        ], $videoKey);
    }

    public function testCreateWithBasicFields()
    {
        $video = Video::create($this->data);
        $video->refresh();

        $this->assertEquals(36, strlen($video->id));
        $this->assertFalse($video->opened);
        $this->assertDatabaseHas('videos', $this->data + ['opened' => false]);

        $video = Video::create($this->data + ['opened' => true]);
        $this->assertTrue($video->opened);
        $this->assertDatabaseHas('videos', ['opened' => true]);
    }

    public function testCreateWithRelations()
    {
        $category = factory(Category::class)->create();
        $genre = factory(Genre::class)->create();
        $video = Video::create($this->data + [
            'categories_id' => [$category->id],
            'genres_id' => [$genre->id],
        ]);

        $this->assertHasCategory($video->id, $category->id);
        $this->assertHasGenre($video->id, $genre->id);
    }

      public function testRollbackCreate()
    {
        $hasError = false;
         try {
            Video::create([
                'title' => 'title',
                'description' => 'description',
                'year_launched' => 2010,
                'rating' => Video::RATING_LIST[0],
                'duration' => 90,
                'categories_id' => [1,2,3]
            ]);
         } catch(QueryException $exception) {
             $this->assertCount( 0, Video::all());
             $hasError = true;
         }
     
         $this->assertTrue($hasError);
     }

     public function testRollbackUpdate()
     {
        $video = factory(Video::class)->create();
        $oldTitle = $video->title;
        try {
        $video->update([
            'title' => 'title',
            'description' => 'description',
            'year_launched' => 2010,
            'rating' => Video::RATING_LIST[0],
            'duration' => 90,
            'categories_id' => [1,2,3]
        ]);
        } catch(QueryException $exception) {
            $this->assertDatabaseHas('videos', [
                'title' => $oldTitle
            ]);
        }
     } 

    public function testeUpdatedWithBasicFields()
    {
        $video = factory(Video::class)->create(
            ['opened' => false]
        );
        $video->update($this->data);
        $this->assertFalse($video->opened);
        $this->assertDatabaseHas('videos', $this->data + ['opened' => false]);

        $video = factory(Video::class)->create(
            ['opened' => false]
        );
        $video->update($this->data + ['opened' => true]);
        $this->assertTrue($video->opened);
        $this->assertDatabaseHas('videos', $this->data + ['opened' => true]);
    }

    public function testUpdateWithRelations()
    {
        $category = factory(Category::class)->create();
        $genre = factory(Genre::class)->create();
        $video = factory(Video::class)->create();
        $video->update($this->data + [
            'categories_id' => [$category->id],
            'genres_id' => [$genre->id],
        ]);

        $this->assertHasCategory($video->id, $category->id);
        $this->assertHasGenre($video->id, $genre->id);
    }

    public function testHandRelations()
    {
        $video = factory(Video::class)->create();
        Video::handleRelations($video, []);
        $this->assertCount(0, $video->categories);
        $this->assertCount(0, $video->genres);

        $category = factory(Category::class)->create();
        Video::handleRelations($video, [
            'categories_id' => [$category->id]
        ]);
        $video->refresh();
        $this->assertCount(1, $video->categories);

        $genre = factory(Genre::class)->create();
        Video::handleRelations($video, [
            'genres_id' => [$genre->id]
        ]);
        $video->refresh();
        $this->assertCount(1,$video->genres);

        $video->categories()->delete();
        $video->genres()->delete();

        Video::handleRelations($video, [
            'categories_id' => [$category->id],
            'genres_id' => [$genre->id],
        ]);
        $video->refresh();
        $this->assertCount(1, $video->categories);
        $this->assertCount(1, $video->genres);
    }

    public function testCategoriesSync() 
    {
        $categoriesId = factory(Category::class, 3)->create()->pluck('id')->toArray();
        $video = factory(Video::class)->create();
        Video::handleRelations($video, [
            'categories_id' => [$categoriesId[0]],
            'video_id' => $video->id
        ]);

        Video::handleRelations($video, [
            'categories_id' => [$categoriesId[1], $categoriesId[2]]
        ]);

        $this->assertDatabaseMissing('category_video', [
            'category_id' => $categoriesId[0],
            'video_id' => $video->id
        ]);

        $this->assertDatabaseHas('category_video', [
            'category_id' => $categoriesId[1],
            'video_id' => $video->id
        ]);

        $this->assertDatabaseHas('category_video', [
            'category_id' => $categoriesId[2],
            'video_id' => $video->id
        ]);
    }

    public function testGenresSync() 
    {
        $genresId = factory(Genre::class, 3)->create()->pluck('id')->toArray();
        $video = factory(Video::class)->create();
        Video::handleRelations($video, [
            'genres_id' => [$genresId[0]],
        ]);
        
        $this->assertDatabaseHas('genre_video', [
            'genre_id' => $genresId[0],
            'video_id' => $video->id
        ]);

        Video::handleRelations($video, [
            'genres_id' => [$genresId[1], $genresId[2]]
        ]);

        $this->assertDatabaseMissing('genre_video', [
            'genre_id' => $genresId[0],
            'video_id' => $video->id
        ]);

        $this->assertDatabaseHas('genre_video', [
            'genre_id' => $genresId[1],
            'video_id' => $video->id
        ]);

        $this->assertDatabaseHas('genre_video', [
            'genre_id' => $genresId[2],
            'video_id' => $video->id
        ]);
    }


    public function testUpdatedWithFiles()
   {
    \Storage::fake();
    $video = factory(Video::class)->create();
    $thumbFile = UploadedFile::fake()->image('thumb.jpg');
    $videoFile = UploadedFile::fake()->create('video.mp4');
    $video->update($this->data + [
      'thumb_file' => $thumbFile,
      'video_file' => $videoFile,
    ]);
    \Storage::assertExists("{$video->id}/{$video->thumb_file}");
    \Storage::assertExists("{$video->id}/{$video->video_file}");

    $newVideoFile = UploadedFile::fake()->image('video.mp4');
    $video->update($this->data + [
        'video_file' => $newVideoFile,
    ]);
    \Storage::assertExists("{$video->id}/{$thumbFile->hashName()}");
    \Storage::assertExists("{$video->id}/{$newVideoFile->hashName()}");
    \Storage::assertMissing("{$video->id}/{$videoFile->hashName()}");
   }

   public function testUpdateIfRollBackFiles()
   {
       \Storage::fake();
       $video = factory(Video::class)->create();
       \Event::Listen(TransactionCommitted::class, function() {
           throw new TestException();
       });

       $hasError = false;

       try  {
           $video->update(
               $this->data + [
                   'video_file' => UploadedFile::fake()->create('video.mp4'),
                   'thumb_file' => UploadedFile::fake()->image('thumb.jpg')
               ]
               );
       } catch (TestException $e) {
           $this->assertCount(0, \Storage::allFiles());
           $hasError = true;
       }

       $this->assertTrue($hasError);
   }

   public function testFileUrlsWithLocalDriver()
   {
       $fileFields = [];
       foreach(Video::$fileFields as $field){
           $fileFields[$field] = "$field.test";
       }

       $video = factory(Video::class)->create($fileFields);
       $localDriver = config('filesystems.default');
       $baseUrl = config('filesystems.disks.' . $localDriver)['url'];
       foreach($fileFields as $field => $value){
           $fileUrl = $video->{"{$field}_url"};
           $this->assertEquals("{$baseUrl}/$video->id/$value", $fileUrl);
       }
   }

   public function testFileUrlsWithGcsDriver()
   {
    $fileFields = [];
    foreach(Video::$fileFields as $field){
        $fileFields[$field] = "$field.test";
    }

    $video = factory(Video::class)->create($fileFields);
    $localDriver = config('filesystems.default');
    $baseUrl = config('filesystems.disks.gcs.storage_api_uri');
    \Config::set('filesystems.default','gcs');
    foreach($fileFields as $field => $value){
        $fileUrl = $video->{"{$field}_url"};
        $this->assertEquals("{$baseUrl}/$video->id/$value", $fileUrl);
    }
   }

   public function testFileUrlsIfNullWhenFieldsAreNull()
   {
       $video = factory(Video::class)->create();
       foreach(Video::$fileFields as $field){
           $fileUrl = $video->{"{$field}_url"};
           $this->assertNull($fileUrl);
       }
   }

    protected function assertHasCategory($videoId, $categoryId)
    {
        $this->assertDatabaseHas('category_video', [
            'video_id' => $videoId,
            'category_id' => $categoryId
        ]);
    }

    protected function assertHasGenre($videoId, $genreId){
        $this->assertDatabaseHas('genre_video', [
            'video_id' => $videoId,
            'genre_id' => $genreId
        ]);
    }
}
