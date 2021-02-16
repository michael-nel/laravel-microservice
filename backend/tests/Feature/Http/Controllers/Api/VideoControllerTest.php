<?php

namespace Http\Controllers\Api;

use App\Http\Controllers\Api\VideoController;
use App\Models\Category;
use App\Models\Genre;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\Exceptions\TestException;
use Tests\TestCase;
use Tests\Traits\TestSaves;
use Tests\Traits\TestUploads;
use Tests\Traits\TestValidations;
use Tests\Traits\TestResources;
use Illuminate\Http\UploadedFile;
use Illuminate\Database\Events\TransactionCommitted;
use Illuminate\Foundation\Testing\TestResponse;
use App\Http\Resources\VideoResource;


class VideoControllerTest extends TestCase
{
    use DatabaseMigrations, TestValidations, TestSaves, TestUploads, TestResources;


    private $fieldsSerialized = [
        'id',
        'title',
        'description',
        'year_launched',
        'rating',
        'duration',
        'rating',
        'opened',
        'thumb_file_url',
        'banner_file_url',
        'video_file_url',
        'trailer_file_url',
        'created_at',
        'updated_at',
        'deleted_at',
        'categories' => [
            '*' => [
                'id',
                'name',
                'description',
                'is_active',
                'created_at',
                'updated_at',
                'deleted_at'
            ]
        ],
        'genres' => [
            '*' => [
                'id',
                'name',
                'is_active',
                'created_at',
                'updated_at',
                'deleted_at'
            ]
        ]
    ];

    private $video;
    private $sendData;

    protected function setUp() : void
    {
        parent::setUp();
        $this->video = factory(Video::class)->create([
            'opened' => false
        ]);
        $this->sendData = [
            'title' => 'title',
            'description' => 'description',
            'year_launched' => 2010,
            'rating' => Video::RATING_LIST[0],
            'duration' => 90,
        ];
    }

   public function testInvalidationThumbField()
  {
    $this->assertInvalidationFile(
      'banner_file',
      'jpg',
      Video::BANNER_FILE_MAX_SIZE,
      'image'
    );
  }

  public function testInvalidationBannerField()
  {
    $this->assertInvalidationFile(
      'banner_file',
      'jpg',
      Video::BANNER_FILE_MAX_SIZE,
      'image'
    );
  }

  public function testInvalidationTrailerField()
  {
    $this->assertInvalidationFile(
      'trailer_file',
      'mp4',
      Video::TRAILER_FILE_MAX_SIZE,
      'mimetypes', ['values' => 'video/mp4']
    );
  }

  public function testInvalidationVideoField()
  {
    $this->assertInvalidationFile(
      'video_file',
      'mp4',
      Video::VIDEO_FILE_MAX_SIZE,
      'mimetypes', ['values' => 'video/mp4']
    );
  }


    public function testIndex()
    {
        $response = $this->get(route('videos.index'));
        $response
            ->assertStatus(200)
            ->assertJsonStructure(
                [
                    'data' => [
                        '*' => $this->fieldsSerialized
                    ],
                    'meta' => [],
                    'links' => []
                ]
                );
        $this->assertResource($response, VideoResource::collection(collect([$this->video])));
        //$this->assertIfFilesUrlExists($this->video, $response);
    }

    public function testInvalidationRequired()
    {
        $data = [
            'title' => '',
            'description' => '',
            'year_launched' => '',
            'rating' => '',
            'duration' => ''
        ];
        $this->assertInvalidationInStoreAction($data, 'required');
        $this->assertInvalidationInUpdateAction($data, 'required');
    }


    public function testInvalidationMax()
    {
        $data = [
            'title' => str_repeat('a', 256)
        ];
        $this->assertInvalidationInStoreAction($data, 'max.string', ['max' => 255]);
        $this->assertInvalidationInUpdateAction($data, 'max.string', ['max' => 255]);
    }

    public function testInvalidationInteger()
    {
        $data = [
            'duration' => 'a'
        ];
        $this->assertInvalidationInStoreAction($data, 'integer');
        $this->assertInvalidationInUpdateAction($data, 'integer');
    }

    public function testInvalidationYearLaunchedField()
    {
        $data = [
            'year_launched' => 'a'
        ];
        $this->assertInvalidationInStoreAction($data, 'date_format', ['format' => 'Y']);
        $this->assertInvalidationInUpdateAction($data, 'date_format', ['format' => 'Y']);
    }

    public function testInvalidationOpenedField()
    {
        $data = [
            'opened' => 's'
        ];
        $this->assertInvalidationInStoreAction($data, 'boolean');
        $this->assertInvalidationInUpdateAction($data, 'boolean');
    }

    public function testInvalidationRatingField()
    {
        $data = [
            'rating' => 0
        ];
        $this->assertInvalidationInStoreAction($data, 'in');
        $this->assertInvalidationInUpdateAction($data, 'in');
    }

    public function testInvalidationCategoriesIdField()
    {
        $data = [
            'categories_id' => 'a'
        ];
        $this->assertInvalidationInStoreAction($data, 'array');
        $this->assertInvalidationInUpdateAction($data, 'array');

        $data = [
            'categories_id' => [100]
        ];
        $this->assertInvalidationInStoreAction($data, 'exists');
        $this->assertInvalidationInUpdateAction($data, 'exists');
    }

    public function testInvalidationGenresIdField()
    {
        $data = [
            'genres_id' => 'a'
        ];
        $this->assertInvalidationInStoreAction($data, 'array');
        $this->assertInvalidationInUpdateAction($data, 'array');

        $data = [
            'genres_id' => [100]
        ];
        $this->assertInvalidationInStoreAction($data, 'exists');
        $this->assertInvalidationInUpdateAction($data, 'exists');

        $category = factory(Category::class)->create();
        $category->delete();
        $data = [
            'categories_id' => [$category->id]
        ];
        $this->assertInvalidationInStoreAction($data, 'exists');
        $this->assertInvalidationInUpdateAction($data, 'exists');
    }

    //Both Nethods Store & Update are same so make a method Save

     public function testSave()
     {
         $category = factory(Category::class)->create();
         $castMember = factory(CastMember::class)->create();
         $genre = factory(Genre::class)->create();
         $genre->categories()->sync($category->id);
         

         $data = [
           [
               'send_data' => $this->sendData + [
                   'categories_id' => [$category->id],
                   'genres_id' => [$genre->id]
                   ],
               'test_data' => $this->sendData + ['opened' => false]
           ],
           [
               'send_data' => $this->sendData + [
                   'opened' => true,
                   'categories_id' => [$category->id],
                   'genres_id' => [$genre->id]
                   ],
               'test_data' => $this->sendData + ['opened' => true]
           ],
           [
               'send_data' => $this->sendData + [
                   'rating' => Video::RATING_LIST[1],
                       'categories_id' => [$category->id],
                       'genres_id' => [$genre->id]
                   ],
               'test_data' => $this->sendData + ['rating' => Video::RATING_LIST[1]]
           ],
         ];

         foreach($data as $key => $value) {
             $response = $this->assertStore(
                 $value['send_data'],
                 $value['test_data'] + ['deleted_at' => null]
             );
             $response->assertJsonStructure([
                'data' => $this->fieldsSerialized
             ]);

             $this->assertHasCategory(
                 $response->json('data.id'),
                 $value['send_data']['categories_id'][0]
             );
             $this->assertHasGenre(
                 $response->json('data.id'),
                 $value['send_data']['genres_id'][0]
             );

             $response = $this->assertUpdate(
                 $value['send_data'],
                 $value['test_data'] + ['deleted_at' => null]
             );
             $response->assertJsonStructure([
                'data' => $this->fieldsSerialized
             ]);
         }
     }

     protected function assertHasCategory($videoId, $categoryId)
     {
         $this->assertDatabaseHas('category_video', [
         'video_id' => $videoId,
         'category_id' => $categoryId
         ]);
     }

     protected function assertHasGenre($videoId, $genreId)
     {
         $this->assertDatabaseHas('genre_video', [
             'video_id' => $videoId,
             'genre_id' => $genreId
         ]);
     }

     public function testSyncCategories()
     {
         $categoriesId = factory(Category::class, 3)->create()->pluck('id')->toArray();
         $genre = factory(Genre::class)->create();
         $genre->categories()->sync($categoriesId);
         $genreId = $genre->id;

         $response = $this->json(
             'POST',
             $this->routeStore(),
                $this->sendData + [
                    'genres_id' => [$genreId],
                    'categories_id' => [$categoriesId[0]],
                ]
        );

        $this->assertDatabaseHas('category_video', [
            'category_id' => $categoriesId[0],
            'video_id' => $response->json('data.id')
        ]);
        
        $response = $this->json(
            'PUT',
            route('videos.update', ['video' => $response->json('data.id')]),
            $this->sendData + [
                'genres_id' => [$genreId],
                'categories_id' => [$categoriesId[1], $categoriesId[2]]
            ]
        );
        
        $this->assertDatabaseMissing('category_video', [
            'category_id' => $categoriesId[0],
            'video_id' => $response->json('data.id')
        ]);

        $this->assertDatabaseHas('category_video', [
            'category_id' => $categoriesId[1],
            'video_id' => $response->json('data.id')
        ]);

        $this->assertDatabaseHas('category_video', [
            'category_id' => $categoriesId[2],
            'video_id' => $response->json('data.id')
        ]);
     }

     public function testSyncGenres()
     {
         $genres = factory(Genre::class, 3)->create();
         $genresId = $genres->pluck('id')->toArray();
         $categoryId = factory(Category::class)->create()->id;
         $genres->each(function($genre) use ($categoryId){
            $genre->categories()->sync($categoryId);
         });

         $response = $this->json(
             'POST',
             $this->routeStore(),
             $this->sendData + [
                 'categories_id' => [$categoryId],
                 'genres_id' => [$genresId[0]],
             ]);

            $this->assertDatabaseHas('genre_video', [
                'genre_id' => $genresId[0],
                'video_id' => $response->json('data.id')
            ]);

        $response = $this->json(
            'PUT',
            route('videos.update', ['video' => $response->json('data.id')]),
            $this->sendData + [
                'categories_id' => [$categoryId],
                'genres_id' => [$genresId[1], $genresId[2]]
            ]
        );

        $this->assertDatabaseMissing('genre_video', [
            'genre_id' => $genresId[0],
            'video_id' => $response->json('data.id')
        ]);

        $this->assertDatabaseHas('genre_video', [
            'genre_id' => $genresId[1],
            'video_id' => $response->json('data.id')
        ]);

        $this->assertDatabaseHas('genre_video', [
            'genre_id' => $genresId[2],
            'video_id' => $response->json('data.id')
        ]);

     }

     public function testSavedWithoutFiles()
     {
         $category = factory(Category::class)->create();
         $genre = factory(Genre::class)->create();
         $genre->categories()->sync($category->id);

         $data = [
            [
                'send_data' => $this->sendData + [
                    'categories_id' => [$category->id],
                    'genres_id' => [$genre->id],
            ],
                'test_data' => $this->sendData + ['opened' => false]
            ],
            [
                'send_data' => $this->sendData + [
                    'opened' => true,
                    'categories_id' => [$category->id],
                    'genres_id' => [$genre->id],
            ],
                'test_data' => $this->sendData + ['opened' => true]
            ],
            [
                'send_data' => $this->sendData + [
                    'rating' => Video::RATING_LIST[1],
                    'categories_id' => [$category->id],
                    'genres_id' => [$genre->id],
            ],
                'test_data' => $this->sendData + ['rating' => Video::RATING_LIST[1]]
            ],
        ];

        foreach($data as $key => $value) 
        {
            $response = $this->assertStore(
                $value['send_data'],
                    $value['test_data'] + ['deleted_at' => null]
            );
            $response->assertJsonStructure([
                'data' => $this->fieldsSerialized
            ]);
            $this->assertResource(
                $response,
                new VideoResource(Video::find($response->json('data.id')))
            );
            
            $response = $this->assertUpdate(
                $value['send_data'],
                $value['test_data'] + ['deleted_at' => null]
            );
            
            $response->assertJsonStructure([
                'data' => $this->fieldsSerialized
            ]);
            $this->assertResource(
                $response,
                new VideoResource(Video::find($response->json('data.id')))
            );
        }
     }

     public function testStoreWithFiles()
     {
        \Storage::fake();
         $files = $this->getFiles();

         $category = factory(Category::class)->create();
         $genre = factory(Genre::class)->create();
         $genre->categories()->sync($category->id);;

         $response = $this->json(
             'POST',
             $this->routeStore(),
             $this->sendData + 
             ['categories_id' => [$category->id],
             'genres_id' => [$genre->id],
             ] + $files
         );
         $response->assertStatus(201);
         $this->assertFilesOnPersist($response , $files);
     }

     public function testUpdatedWithFiles()
     {
        \Storage::fake();
        $files = $this->getFiles();

        $category = factory(Category::class)->create();
        $genre = factory(Genre::class)->create();
        $genre->categories()->sync($category->id);

        $response = $this->json(
            'PUT',
            $this->routeUpdate(),
            $this->sendData + 
            ['categories_id' => [$category->id],
            'genres_id' => [$genre->id],
            ] + $files
        );
        $response->assertStatus(200);
        $this->assertFilesOnPersist($response,$files);
     }

     public function testCreateWithFiles()
     {
         \Storage::fake();
         $video = Video::create(
             $this->sendData + [
                 'thumb_file' => UploadedFile::fake()->image('thumb.jpg'),
                 'video_file' => UploadedFile::fake()->image('video.mp4'),
             ]);

             \Storage::assertExists("{$video->id}/{$video->thumb_file}");
             \Storage::assertExists("{$video->id}/{$video->video_file}");
     }

    public function testCreateIfRollbackFiles()
    {
        \Storage::fake();
        \Event::listen(TransactionCommitted::class, function (){
            throw new TestException();
        });

        $hasError=false;

        try {
            Video::create(
                $this->sendData + [
                    'thumb_file' => UploadedFile::fake()->image('thumb.jpg'),
                    'video_file' => UploadedFile::fake()->image('video.mp4'),
                ]);
        } catch (TestException $e) {
            $this->assertCount(0, \Storage::allFiles());
            $hasError = true;
        }
        $this->assertTrue($hasError);
    }

     public function testShow(){
        $response = $this->json('GET', route('videos.show',['video' => $this->video->id]));
        $response
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => $this->fieldsSerialized
            ]);
            $this->assertResource(
                $response,
                new VideoResource(Video::find($response->json('data.id')))
            );
     }

    public function testDestroy()
    {
        $response = $this->json('DELETE', route('videos.destroy',['video' => $this->video->id ]));
        $response->assertStatus(204);
        $this->assertNull(Video::find($this->video->id));
        $this->assertNotNull(Video::withTrashed()->find($this->video->id));
    }

    protected function assertFilesOnPersist(TestResponse $response, $files){
        $id = $response->json('id') ?? $response->json('data.id');
        $video = Video::find($id);
        $this->assertFilesExistsInStorage($video, $files);
    }

    protected function getFiles()
    {
        return [
            'thumb_file' => UploadedFile::fake()->create('thumb_file.jpg'),
            'banner_file' => UploadedFile::fake()->create('banner_file.jpg'),
            'trailer_file' => UploadedFile::fake()->create('trailer_file.mp4'),
            'video_file' => UploadedFile::fake()->create('video_file.mp4'),
        ];
    }

    protected function model()
    {
        return Video::class;
    }

    protected function routeStore()
    {
        return route('videos.store');
    }

    protected function routeUpdate()
    {
        return route('videos.update', ['video' => $this->video->id]);
    }
}
