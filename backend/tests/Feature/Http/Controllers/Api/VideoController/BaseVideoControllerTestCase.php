<?php

namespace Tests\Feature\Http\Controllers\Api\VideoController;

use App\Model\Video;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Tests\TestCase;

abstract class BaseVideoControllerTestCase extends TestCase
{
  use DatabaseMigrations;

  protected $video;
  protected $sendData;

  protected function setUp(): void
  {
    parent::setUp();
    $this->video = factory(Video::class)->create([
      'opened' => false
    ]);
    $this->sendData = [
      'title' => 'title',
      'descritption' => 'description',
      'year_launched' => 2010,
      'rating' => Video::RATING_LIST[0],
      'duration' => 90,
    ];
  }
}