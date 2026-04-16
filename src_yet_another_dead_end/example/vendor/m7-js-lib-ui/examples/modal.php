<div class="nav-actions">
  <button class="btn btn-sm btn-primary" id="proxy-button-modal-user-org-insert" data-button-proxy="button-modal-user-org-insert">
    + New Organization
  </button>
</div>
<div hidden>
  <a id="button-modal-user-org-insert" role="button" data-dialog-trigger="" aria-controls="modal-user-org-insert" style="cursor:pointer" onclick="">user-org-create</a>
</div>
<div id="modal-user-org-insert" class="modal-container modal-hidden  modal-content" role="dialog" aria-modal="true" aria-hidden="false" style="height: 70vh" data-map-key="root">

  <!-- Header -->
  <div class="modal-header">

    <!-- Close Button -->
    <button id="button-modal-user-org-insert-close" class="btn-x-single icon-close" data-dialog-close="" aria-controls="modal-user-org-insert">
    </button>

    <h2>Organization Properties</h2>
  </div>

  
  
  <!-- Body -->
  <div class="modal-panel modal-scroll-content p-1" style="height: calc(100% - 140px);">

    <!-- tabs -->
    <div data-tab-parent="" data-toggle-off="false" data-toggle-on="false" data-children="panel-members-modal-user-org-properties panel-members-modal-user-org-members panel-members-modal-user-org-notes" data-toggle-group="group-modal-user-org" class="floating-panel">
      <ul id="panel-members-tablist-modal-user-org" role="tablist" data-tab-parent="" data-toggle-on="false" data-toggle-off="false" class="flexy-row justify-center tab-bar-links">
	<li role="presentation" class="tab-item">
	  <a id="tab-members-modal-user-org-properties" role="tab" data-tab-trigger="" aria-selected="true" aria-controls="panel-members-modal-user-org-properties" class="tab-link children-tab-link selected">Properties</a>
	</li>
	<!--
	<li role="presentation" class="tab-item">
	  <a id="tab-members-modal-user-org-issue" role="tab" data-tab-trigger aria-selected="false" aria-controls="panel-members-modal-user-org-members" class="tab-link children-tab-link">Issue</a>
	</li> -->
	<li role="presentation" class="tab-item">
	  <a id="tab-members-modal-user-org-notes" role="tab" data-tab-trigger="" aria-selected="false" aria-controls="panel-members-modal-user-org-notes" class="tab-link children-tab-link">Notes</a>
	</li>
      </ul>
      <div data-map-key="archived-warning" style="display: none;">
	<p>
	  <strong>Warning</strong>
	</p>
	<p>
	  Archived Data is read only. you must restore it before making edits
	</p>
	<hr>
      </div>


      <!-- NOTES -->
      <div id="panel-members-modal-user-org-notes" class="tab-panel tab-hidden" role="tab-panel" aria-hidden="true">

	<p><strong>About Organizations</strong></p>

	<p>
	  Organizations are the top-level containers in your account.  
	  Each organization represents a distinct business, project, or
	  operational boundary. All clients, users, and groups belong to an
	  organization, and may not cross between organizations unless they
	  are explicitly enrolled.
	</p>

	<p>
	  Every organization has a single <em>owner</em> (a user), who may
	  transfer ownership to another user if needed. While organizations
	  can contain many clients and many users, administrative actions are
	  always performed by users — clients cannot administer or modify
	  organizations directly.
	</p>

	<hr>

	<p><strong>Clients, Members, and Groups</strong></p>

	<p>
	  A client may be attached to one or more <em>groups</em> inside the
	  same organization. Groups are used to define access tiers or
	  membership segments — for example:
	</p>

	<ul>
	  <li><code>general</code> members for a forum</li>
	  <li><code>premium</code> subscribers with additional privileges</li>
	  <li>separate groups for different products or service levels</li>
	</ul>

	<p>
	  Groups are <em>organization-scoped</em>. A client cannot join a
	  group in another organization unless that client is independently
	  registered to that organization.
	</p>

	<hr>

	<p><strong>Purpose of Organizations</strong></p>

	<p>
	  Organizations allow you to create isolated member pools that can
	  validate access to your products and services. This lets you manage:
	</p>

	<ul>
	  <li>user communities for different businesses or projects</li>
	  <li>premium vs. free access tiers</li>
	  <li>application-specific client registries</li>
	  <li>separate identity spaces for multiple brands</li>
	</ul>

	<p>
	  For example, you might maintain:
	</p>

	<ul>
	  <li>a forum community with <code>general</code> and <code>premium</code> groups</li>
	  <li>a news website with entirely different membership requirements</li>
	</ul>

	<p>
	  Both can live under separate organizations, each with its own set of
	  clients, users, and groups — without interfering with each other.
	</p>

      </div>
      <!-- /NOTES -->
      

      <!-- Organization Properties Panel -->
      <div id="panel-members-modal-user-org-properties" class="tab-panel" role="tab-panel" aria-hidden="false">

	<form id="user-org-properties-form">

	  <!-- Organization ID (read-only) -->
	  <div class="form-group" data-map-key="id-row" style="display: none;">
	    <label>Organization ID</label>
	    <input type="text" class="form-control readonly" name="id" data-map-key="id" readonly="">
	  </div>

	  <!-- Owner (read-only) -->
	  <div class="form-group" data-map-key="owner-row">
	    <label>Owner (User ID)</label>
	    <input type="text" class="form-control readonly" name="owner" data-map-key="owner" readonly="">
	  </div>

	  <!-- Status -->
	  <div class="form-group">
	    <label>Status</label>
	    <select class="form-control" name="status" data-map-key="status">
              <option value="active">active</option>
              <option value="disabled">disabled</option>
              <option value="archived">archived</option>
	    </select>
	  </div>

	  <!-- Name -->
	  <div class="form-group">
	    <label>Name</label>
	    <input type="text" class="form-control" name="name" data-map-key="name" placeholder="Organization name">
	  </div>

	  <!-- Slug -->
	  <div class="form-group">
	    <label>Slug</label>
	    <input type="text" class="form-control" name="slug" data-map-key="slug" placeholder="short-identifier">
	    <small class="muted">
              Must be unique *within this owner*.  
              Used for URLs / API references.
	      Blank == auto generated based on name
	    </small>
	  </div>

	  <!-- Description -->
	  <div class="form-group">
	    <label>Description</label>
	    <textarea class="form-control" rows="3" name="description" data-map-key="description" placeholder="Optional organization description..."></textarea>
	  </div>

	  <!-- Data (JSON) -->
	  <div class="form-group">
	    <label>Data (JSON)</label>
	    <textarea class="form-control" rows="4" name="data" data-map-key="data" placeholder="{ ... }"></textarea>
	  </div>

	  <!-- Created -->
	  <div class="form-group">
	    <label>Created</label>
	    <input type="text" class="form-control readonly" data-map-key="created" readonly="">
	  </div>

	  <!-- Modified -->
	  <div class="form-group">
	    <label>Last Modified</label>
	    <input type="text" class="form-control readonly" data-map-key="updated" readonly="">
	  </div>

	  <!-- Expires -->
	  <div class="form-group">
	    <label>Expires</label>
	    <input type="text" class="form-control" name="expires" data-map-key="expires" placeholder="YYYY-MM-DD HH:MM:SS or empty">
	  </div>

	  <!-- Archive metadata (read-only) -->
	  <div class="form-group" data-map-key="archive-info" style="display: none;">
	    <label>Archive Note</label>
	    <textarea class="form-control" rows="2" name="archive_note" data-map-key="archive_note" placeholder="Optional archive reason..." readonly=""></textarea>
	  </div>

	  <!-- Hidden raw fields -->
	  <input type="hidden" data-map-key="archived">
	  <input type="hidden" data-map-key="archived_by">
	  <input type="hidden" data-map-key="archived_at">

	  <div hidden="">
	    <button type="button" id="button-user-org-properties-insert" data-trigger-ignore="true" value="insert">
              Insert
	    </button>
	    <button type="button" id="button-user-org-properties-restore" data-trigger-ignore="true" value="restore">
              Restore
	    </button>

	    <button type="button" id="button-user-org-properties-save" data-trigger-ignore="true" value="update">
              Save
	    </button>
	  </div>

	</form>

      </div>

      <!-- /end properties -->
      
    </div>
  </div>
  <!-- Footer -->
  <div class="modal-footer spacer">

    <button class="btn btn-sm btn-secondary" type="button" data-button-proxy="button-modal-user-org-insert-close" aria-controls="modal-user-org-properties">
      Cancel
    </button>

    <button class="btn btn-sm btn-primary" style="" type="button" data-map-key="button-insert" data-button-proxy="button-user-org-properties-insert" aria-controls="modal-user-org-properties">
      Insert
    </button>
    <button class="btn btn-sm btn-primary" style="display:none" type="button" data-map-key="button-restore" data-button-proxy="button-user-org-properties-restore" aria-controls="modal-user-org-properties">
      Restore
    </button>
    <button class="btn btn-sm btn-primary" type="button" data-map-key="button-save" data-button-proxy="button-user-org-properties-save" aria-controls="modal-user-org-properties" style="display: none;">
      Save
    </button>
  </div>
  

</div>
